use clap::{Parser, Subcommand};
use regex::Regex;
use rusqlite::{params, params_from_iter, Connection, OptionalExtension};
use serde::Serialize;
use sha2::{Digest, Sha256};
use std::collections::{HashMap, HashSet};
use std::env;
use std::f64;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};

const DEFAULT_DB_PATH: &str = "~/.local/state/agent-review-findings/reviews.sqlite";
const VECTOR_DIMENSIONS: usize = 384;
const SECONDS_PER_DAY: f64 = 86_400.0;
const MIN_SEMANTIC_MATCH_SCORE: f64 = 0.20;

#[derive(Parser)]
#[command(name = "review-findings")]
#[command(about = "Fast local SQLite search for review findings.")]
struct Cli {
    #[arg(long, global = true)]
    db: Option<PathBuf>,

    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    Init,
    Record {
        #[arg(long)]
        repo: String,
        #[arg(long)]
        repo_path: String,
        #[arg(long, default_value = "")]
        branch: String,
        #[arg(long)]
        target: String,
        #[arg(long, default_value = "")]
        base: String,
        #[arg(long, default_value = "")]
        head: String,
        #[arg(long, default_value = "active")]
        run_status: String,
        #[arg(long, default_value = "")]
        decision_log: String,
        #[arg(long)]
        decision_id: String,
        #[arg(long)]
        status: String,
        #[arg(long)]
        source: String,
        #[arg(long)]
        fingerprint: String,
        #[arg(long)]
        summary: String,
        #[arg(long, default_value = "")]
        impact: String,
        #[arg(long, default_value = "")]
        priority: String,
        #[arg(long)]
        material: bool,
        #[arg(long, default_value = "")]
        user_impact: String,
        #[arg(long, default_value = "")]
        decision: String,
        #[arg(long, default_value = "")]
        text: String,
    },
    RecordCommand {
        #[arg(long)]
        repo: String,
        #[arg(long)]
        repo_path: String,
        #[arg(long, default_value = "")]
        branch: String,
        #[arg(long)]
        target: String,
        #[arg(long, default_value = "")]
        base: String,
        #[arg(long, default_value = "")]
        head: String,
        #[arg(long)]
        command: String,
        #[arg(long)]
        result: String,
        #[arg(long)]
        reason: String,
        #[arg(long, default_value = "")]
        decision_id: String,
    },
    Query {
        query: String,
        #[arg(long, default_value_t = 8)]
        limit: usize,
        #[arg(long)]
        repo: Option<String>,
        #[arg(long)]
        repo_path: Option<String>,
        #[arg(long)]
        branch: Option<String>,
        #[arg(long)]
        target: Option<String>,
        #[arg(long)]
        all_repos: bool,
        #[arg(long)]
        all_branches: bool,
        #[arg(long)]
        status: Option<String>,
        #[arg(long)]
        show_paths: bool,
        #[arg(long)]
        json: bool,
    },
    Closeout {
        #[arg(long)]
        repo: String,
        #[arg(long)]
        repo_path: Option<String>,
        #[arg(long)]
        branch: Option<String>,
        #[arg(long)]
        target: Option<String>,
        #[arg(long)]
        base: Option<String>,
        #[arg(long)]
        material: bool,
        #[arg(long)]
        json: bool,
    },
    Prune {
        #[arg(long, default_value_t = 90.0)]
        older_than_days: f64,
        #[arg(long, default_value_t = 1)]
        min_seen_count: i64,
        #[arg(long)]
        repo: Option<String>,
        #[arg(long)]
        repo_path: Option<String>,
        #[arg(long)]
        branch: Option<String>,
        #[arg(long)]
        include_open: bool,
        #[arg(long)]
        dry_run: bool,
    },
    Path,
}

#[derive(Clone)]
struct Finding {
    decision_id: String,
    status: String,
    source: String,
    fingerprint: String,
    summary: String,
    impact: String,
    priority: String,
    material: bool,
    user_impact: String,
    decision: String,
    text: String,
}

struct RunRecord<'a> {
    repo: &'a str,
    repo_key: &'a str,
    repo_path: &'a str,
    branch: &'a str,
    target: &'a str,
    base: &'a str,
    head: &'a str,
    status: &'a str,
    decision_log: &'a str,
}

struct QueryFilters<'a> {
    repo: Option<&'a str>,
    repo_key: Option<&'a str>,
    branch: Option<&'a str>,
    target: Option<&'a str>,
    status: Option<&'a str>,
}

struct PruneFilters<'a> {
    repo: Option<&'a str>,
    repo_key: Option<&'a str>,
    branch: Option<&'a str>,
    include_open: bool,
    dry_run: bool,
}

#[derive(Serialize)]
struct QueryResult {
    id: String,
    decision_id: String,
    status: String,
    source: String,
    fingerprint: String,
    summary: String,
    decision: String,
    repo: String,
    branch: String,
    target: String,
    head: String,
    score: f64,
    semantic_score: f64,
    lexical_score: f64,
    last_seen_at: i64,
    seen_count: i64,
    decision_log_path: String,
}

#[derive(Serialize)]
struct Closeout {
    material_findings: Vec<CloseoutFinding>,
    user_visible_or_workflow_changes: Vec<CloseoutFinding>,
    security_data_permission_changes: Vec<CloseoutFinding>,
    lower_risk_findings: Vec<CloseoutFinding>,
    findings_found: Vec<CloseoutFinding>,
    changes_made_while_reviewing: Vec<CloseoutFinding>,
    verification_run: Vec<RecordedCommand>,
    still_open: Vec<CloseoutFinding>,
}

#[derive(Clone, Serialize)]
struct CloseoutFinding {
    decision_id: String,
    status: String,
    source: String,
    summary: String,
    impact: String,
    priority: String,
    material: bool,
    user_impact: String,
    decision: String,
    fingerprint: String,
}

#[derive(Clone, Serialize)]
struct RecordedCommand {
    command: String,
    result: String,
    reason: String,
    decision_id: String,
}

fn main() -> Result<(), String> {
    let cli = Cli::parse();
    let db_path = cli.db.unwrap_or_else(default_db_path);

    if matches!(cli.command, Commands::Path) {
        println!("{}", db_path.display());
        return Ok(());
    }

    let conn = connect(&db_path)?;
    init_db(&conn)?;

    match cli.command {
        Commands::Init => {
            println!("{}", db_path.display());
        }
        Commands::Record {
            repo,
            repo_path,
            branch,
            target,
            base,
            head,
            run_status,
            decision_log,
            decision_id,
            status,
            source,
            fingerprint,
            summary,
            impact,
            priority,
            material,
            user_impact,
            decision,
            text,
        } => {
            let impact = normalize_token(&impact);
            let priority = normalize_token(&priority);
            let material =
                material || is_material_impact(&impact) || is_material_priority(&priority);
            let repo_key = repo_key_from_path(Path::new(&repo_path));
            let text = join_nonempty(&[
                &decision_id,
                &status,
                &source,
                &fingerprint,
                &summary,
                &impact,
                &priority,
                &user_impact,
                &decision,
                &text,
            ]);
            let finding = Finding {
                decision_id,
                status: normalize_status(&status),
                source,
                fingerprint,
                summary,
                impact,
                priority,
                material,
                user_impact,
                decision,
                text,
            };
            let run = RunRecord {
                repo: &repo,
                repo_key: &repo_key,
                repo_path: &repo_path,
                branch: &branch,
                target: &target,
                base: &base,
                head: &head,
                status: &run_status,
                decision_log: &decision_log,
            };
            let (run_id, issue_id) = record_finding_cli(&conn, &run, &finding)?;
            println!(
                "recorded run={run_id} issue={issue_id} decision={} db={}",
                finding.decision_id,
                db_path.display()
            );
        }
        Commands::RecordCommand {
            repo,
            repo_path,
            branch,
            target,
            base,
            head,
            command,
            result,
            reason,
            decision_id,
        } => {
            let repo_key = repo_key_from_path(Path::new(&repo_path));
            let run = RunRecord {
                repo: &repo,
                repo_key: &repo_key,
                repo_path: &repo_path,
                branch: &branch,
                target: &target,
                base: &base,
                head: &head,
                status: "active",
                decision_log: "",
            };
            let run_id = ensure_command_run(&conn, &run)?;
            let recorded = RecordedCommand {
                command,
                result,
                reason,
                decision_id,
            };
            let command_id = store_command(&conn, &run_id, &recorded)?;
            println!(
                "recorded command={command_id} run={run_id} db={}",
                db_path.display()
            );
        }
        Commands::Query {
            query,
            limit,
            repo,
            repo_path,
            branch,
            target,
            all_repos,
            all_branches,
            status,
            show_paths,
            json,
        } => {
            let repo_filter = resolve_query_repo(repo, all_repos)?;
            let repo_key_filter = if all_repos {
                None
            } else {
                resolve_query_repo_key(repo_filter.as_deref(), repo_path.as_deref())
            };
            let branch_filter = resolve_query_branch(branch, all_branches)?;
            let filters = QueryFilters {
                repo: repo_filter.as_deref(),
                repo_key: repo_key_filter.as_deref(),
                branch: branch_filter.as_deref(),
                target: target.as_deref(),
                status: status.as_deref(),
            };
            let results = query_issues(&conn, &query, limit, &filters)?;
            print_results(&results, json, show_paths)?;
        }
        Commands::Closeout {
            repo,
            repo_path,
            branch,
            target,
            base,
            material,
            json,
        } => {
            let repo_key = resolve_query_repo_key(Some(&repo), repo_path.as_deref());
            let closeout = build_closeout(
                &conn,
                &repo,
                repo_key.as_deref(),
                branch.as_deref(),
                target.as_deref(),
                base.as_deref(),
            )?;
            print_closeout(&closeout, json, material)?;
        }
        Commands::Prune {
            older_than_days,
            min_seen_count,
            repo,
            repo_path,
            branch,
            include_open,
            dry_run,
        } => {
            let repo_key = resolve_query_repo_key(repo.as_deref(), repo_path.as_deref());
            let filters = PruneFilters {
                repo: repo.as_deref(),
                repo_key: repo_key.as_deref(),
                branch: branch.as_deref(),
                include_open,
                dry_run,
            };
            let count = prune_findings(&conn, older_than_days, min_seen_count, &filters)?;
            let action = if dry_run { "would prune" } else { "pruned" };
            println!("{action} findings={count} db={}", db_path.display());
        }
        Commands::Path => {}
    }

    Ok(())
}

fn default_db_path() -> PathBuf {
    let raw = env::var("AGENT_REVIEW_FINDINGS_DB").unwrap_or_else(|_| DEFAULT_DB_PATH.to_string());
    expand_home(&raw)
}

fn expand_home(raw: &str) -> PathBuf {
    if raw == "~" {
        return env::var("HOME")
            .map(PathBuf::from)
            .unwrap_or_else(|_| PathBuf::from(raw));
    }
    if let Some(rest) = raw.strip_prefix("~/") {
        if let Ok(home) = env::var("HOME") {
            return Path::new(&home).join(rest);
        }
    }
    PathBuf::from(raw)
}

fn connect(path: &Path) -> Result<Connection, String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|err| err.to_string())?;
    }
    let conn = Connection::open(path).map_err(|err| err.to_string())?;
    conn.pragma_update(None, "journal_mode", "wal")
        .map_err(|err| err.to_string())?;
    conn.pragma_update(None, "synchronous", "normal")
        .map_err(|err| err.to_string())?;
    Ok(conn)
}

fn init_db(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        "
        create table if not exists review_runs (
            id text primary key,
            repo_name text not null,
            repo_key text not null,
            repo_path text not null,
            branch text,
            target text not null,
            base text,
            head text,
            status text not null,
            decision_log_path text,
            started_at integer,
            update_seq integer not null default 0,
            updated_at integer not null
        );

        create table if not exists issues (
            id text primary key,
            run_id text not null references review_runs(id) on delete cascade,
            decision_id text not null,
            status text not null,
            source text not null,
            fingerprint text not null,
            summary text not null,
            impact text,
            priority text,
            material integer not null default 0,
            user_impact text,
            decision text,
            text text not null,
            decision_log_path text,
            first_seen_at integer,
            last_seen_at integer,
            seen_count integer not null default 1,
            updated_at integer not null,
            unique(run_id, decision_id)
        );

        create virtual table if not exists issue_fts using fts5(
            issue_id unindexed,
            text,
            tokenize='porter unicode61'
        );

        create table if not exists issue_vectors (
            issue_id text primary key references issues(id) on delete cascade,
            vector_json text not null,
            content_hash text not null,
            updated_at integer not null
        );

        create table if not exists commands (
            id text primary key,
            run_id text not null references review_runs(id) on delete cascade,
            command text not null,
            result text not null,
            reason text not null,
            decision_id text,
            updated_at integer not null
        );

        create index if not exists issues_run_idx on issues(run_id);
        create index if not exists issues_status_idx on issues(status);
        create index if not exists commands_run_idx on commands(run_id);
        ",
    )
    .map_err(|err| err.to_string())?;
    migrate_schema(conn)?;
    Ok(())
}

fn migrate_schema(conn: &Connection) -> Result<(), String> {
    ensure_column(conn, "review_runs", "repo_key", "text")?;
    ensure_column(conn, "review_runs", "branch", "text")?;
    ensure_column(
        conn,
        "review_runs",
        "update_seq",
        "integer not null default 0",
    )?;
    ensure_column(conn, "issues", "first_seen_at", "integer")?;
    ensure_column(conn, "issues", "last_seen_at", "integer")?;
    ensure_column(conn, "issues", "seen_count", "integer not null default 1")?;
    ensure_column(conn, "issues", "impact", "text")?;
    ensure_column(conn, "issues", "priority", "text")?;
    ensure_column(conn, "issues", "material", "integer not null default 0")?;
    ensure_column(conn, "issues", "user_impact", "text")?;
    let now = now_seconds();
    conn.execute(
        "update issues set first_seen_at = updated_at where first_seen_at is null",
        [],
    )
    .map_err(|err| err.to_string())?;
    conn.execute(
        "update issues set last_seen_at = updated_at where last_seen_at is null",
        [],
    )
    .map_err(|err| err.to_string())?;
    conn.execute(
        "update issues set seen_count = 1 where seen_count is null",
        [],
    )
    .map_err(|err| err.to_string())?;
    conn.execute(
        "update review_runs
         set repo_key = case
           when coalesce(repo_path, '') != '' then repo_path
           else repo_name
         end
         where coalesce(repo_key, '') = ''",
        [],
    )
    .map_err(|err| err.to_string())?;
    conn.execute(
        "update review_runs set update_seq = rowid where update_seq = 0",
        [],
    )
    .map_err(|err| err.to_string())?;
    conn.execute(
        "update issues set first_seen_at = ?1 where first_seen_at is null",
        [now],
    )
    .map_err(|err| err.to_string())?;
    conn.execute(
        "update issues set last_seen_at = ?1 where last_seen_at is null",
        [now],
    )
    .map_err(|err| err.to_string())?;
    conn.execute_batch(
        "
        create index if not exists review_runs_repo_idx on review_runs(repo_name);
        create index if not exists review_runs_repo_key_idx on review_runs(repo_key);
        create index if not exists review_runs_branch_idx on review_runs(branch);
        ",
    )
    .map_err(|err| err.to_string())?;
    Ok(())
}

fn ensure_column(
    conn: &Connection,
    table: &str,
    column: &str,
    definition: &str,
) -> Result<(), String> {
    let mut stmt = conn
        .prepare(&format!("pragma table_info({table})"))
        .map_err(|err| err.to_string())?;
    let columns = stmt
        .query_map([], |row| row.get::<_, String>(1))
        .map_err(|err| err.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|err| err.to_string())?;
    if !columns.iter().any(|name| name == column) {
        conn.execute(
            &format!("alter table {table} add column {column} {definition}"),
            [],
        )
        .map_err(|err| err.to_string())?;
    }
    Ok(())
}

fn ensure_run(conn: &Connection, run: &RunRecord<'_>) -> Result<String, String> {
    let run_id = stable_id(&[run.repo_key, run.branch, run.target, run.base]);
    upsert_run(conn, &run_id, run)?;
    Ok(run_id)
}

fn ensure_command_run(conn: &Connection, run: &RunRecord<'_>) -> Result<String, String> {
    if !run.base.is_empty() {
        return ensure_run(conn, run);
    }

    if let Some(run_id) =
        latest_matching_run_id(conn, run.repo, run.repo_key, run.branch, run.target)?
    {
        touch_command_run(conn, &run_id, run)?;
        return Ok(run_id);
    }

    Err("record-command needs --base when no matching review run exists; record a finding first, or pass --base".to_string())
}

fn latest_matching_run_id(
    conn: &Connection,
    _repo: &str,
    repo_key: &str,
    branch: &str,
    target: &str,
) -> Result<Option<String>, String> {
    conn.query_row(
        "select id
         from review_runs
         where repo_key = ?1
           and coalesce(branch, '') = ?2
           and target = ?3
         order by update_seq desc,
                  updated_at desc,
                  rowid desc
         limit 1",
        params![repo_key, branch, target],
        |row| row.get::<_, String>(0),
    )
    .optional()
    .map_err(|err| err.to_string())
}

fn touch_command_run(conn: &Connection, run_id: &str, run: &RunRecord<'_>) -> Result<(), String> {
    let update_seq = next_review_run_sequence(conn)?;
    conn.execute(
        "update review_runs
         set repo_path = case when ?2 != '' then ?2 else repo_path end,
             head = case when ?3 != '' then ?3 else head end,
             update_seq = ?4,
             updated_at = ?5
         where id = ?1",
        params![run_id, run.repo_path, run.head, update_seq, now_seconds()],
    )
    .map_err(|err| err.to_string())?;
    Ok(())
}

fn record_finding_cli(
    conn: &Connection,
    run: &RunRecord<'_>,
    finding: &Finding,
) -> Result<(String, String), String> {
    let run_id = stable_id(&[run.repo_key, run.branch, run.target, run.base]);
    upsert_run(conn, &run_id, run)?;
    let issue_id = store_finding(conn, &run_id, finding, run.decision_log, false)?;
    Ok((run_id, issue_id))
}

fn store_command(
    conn: &Connection,
    run_id: &str,
    command: &RecordedCommand,
) -> Result<String, String> {
    let command_id = command_id(run_id, command);
    conn.execute(
        "insert into commands (id, run_id, command, result, reason, decision_id, updated_at)
         values (?1, ?2, ?3, ?4, ?5, ?6, ?7)
         on conflict(id) do update set
           result=excluded.result,
           reason=excluded.reason,
           decision_id=excluded.decision_id,
           updated_at=excluded.updated_at",
        params![
            command_id,
            run_id,
            command.command,
            command.result,
            command.reason,
            command.decision_id,
            now_seconds()
        ],
    )
    .map_err(|err| err.to_string())?;
    Ok(command_id)
}

fn command_id(run_id: &str, command: &RecordedCommand) -> String {
    stable_id(&[
        run_id,
        &command.command,
        &command.reason,
        &command.decision_id,
    ])
}

fn upsert_run(conn: &Connection, run_id: &str, run: &RunRecord<'_>) -> Result<(), String> {
    let timestamp = now_seconds();
    let update_seq = next_review_run_sequence(conn)?;
    conn.execute(
        "insert into review_runs (
            id, repo_name, repo_key, repo_path, branch, target, base, head, status,
            decision_log_path, started_at, update_seq, updated_at
        )
        values (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)
        on conflict(id) do update set
            repo_name=excluded.repo_name,
            repo_key=excluded.repo_key,
            repo_path=excluded.repo_path,
            branch=excluded.branch,
            target=excluded.target,
            base=excluded.base,
            head=case when excluded.head != '' then excluded.head else review_runs.head end,
            status=excluded.status,
            decision_log_path=case
              when excluded.decision_log_path != '' then excluded.decision_log_path
              else review_runs.decision_log_path
            end,
            update_seq=excluded.update_seq,
            updated_at=excluded.updated_at",
        params![
            run_id,
            run.repo,
            run.repo_key,
            run.repo_path,
            run.branch,
            run.target,
            run.base,
            run.head,
            run.status,
            run.decision_log,
            timestamp,
            update_seq,
            timestamp
        ],
    )
    .map_err(|err| err.to_string())?;
    Ok(())
}

fn next_review_run_sequence(conn: &Connection) -> Result<i64, String> {
    conn.query_row(
        "select coalesce(max(update_seq), 0) + 1 from review_runs",
        [],
        |row| row.get::<_, i64>(0),
    )
    .map_err(|err| err.to_string())
}

fn store_finding(
    conn: &Connection,
    run_id: &str,
    finding: &Finding,
    decision_log: &str,
    preserve_existing_text: bool,
) -> Result<String, String> {
    let issue_id = stable_id(&[run_id, &finding.decision_id]);
    let timestamp = now_seconds();
    let existing = conn
        .query_row(
            "select first_seen_at, seen_count, text, decision, decision_log_path
             from issues where id = ?1",
            [&issue_id],
            |row| {
                Ok((
                    row.get::<_, Option<i64>>(0)?,
                    row.get::<_, Option<i64>>(1)?,
                    row.get::<_, String>(2)?,
                    row.get::<_, Option<String>>(3)?.unwrap_or_default(),
                    row.get::<_, Option<String>>(4)?.unwrap_or_default(),
                ))
            },
        )
        .optional()
        .map_err(|err| err.to_string())?;
    let first_seen_at = existing
        .as_ref()
        .and_then(|(first_seen, _, _, _, _)| *first_seen)
        .unwrap_or(timestamp);
    let seen_count = existing
        .as_ref()
        .and_then(|(_, seen_count, _, _, _)| *seen_count)
        .map(|count| count + 1)
        .unwrap_or(1);
    let text = existing
        .as_ref()
        .map(|(_, _, existing_text, _, _)| {
            merged_finding_text(existing_text, &finding.text, preserve_existing_text)
        })
        .unwrap_or_else(|| finding.text.clone());
    let decision = existing
        .as_ref()
        .map(|(_, _, _, existing_decision, _)| {
            merged_decision_text(existing_decision, &finding.decision, preserve_existing_text)
        })
        .unwrap_or_else(|| finding.decision.clone());
    let decision_log_path = if decision_log.is_empty() {
        existing
            .as_ref()
            .map(|(_, _, _, _, existing_decision_log)| existing_decision_log.clone())
            .unwrap_or_default()
    } else {
        decision_log.to_string()
    };

    delete_issue(conn, &issue_id)?;
    conn.execute(
        "insert into issues (
            id, run_id, decision_id, status, source, fingerprint, summary,
            impact, priority, material, user_impact, decision, text,
            decision_log_path, first_seen_at, last_seen_at, seen_count, updated_at
        )
        values (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18)",
        params![
            issue_id,
            run_id,
            finding.decision_id,
            finding.status,
            finding.source,
            finding.fingerprint,
            finding.summary,
            finding.impact,
            finding.priority,
            if finding.material { 1 } else { 0 },
            finding.user_impact,
            decision,
            text,
            decision_log_path,
            first_seen_at,
            timestamp,
            seen_count,
            timestamp
        ],
    )
    .map_err(|err| err.to_string())?;
    conn.execute(
        "insert into issue_fts(issue_id, text) values (?1, ?2)",
        params![issue_id, text],
    )
    .map_err(|err| err.to_string())?;
    let vector_json = serde_json::to_string(&vectorize(&text)).map_err(|err| err.to_string())?;
    conn.execute(
        "insert into issue_vectors(issue_id, vector_json, content_hash, updated_at)
         values (?1, ?2, ?3, ?4)",
        params![issue_id, vector_json, content_hash(&text), timestamp],
    )
    .map_err(|err| err.to_string())?;
    Ok(issue_id)
}

fn delete_issue(conn: &Connection, issue_id: &str) -> Result<(), String> {
    conn.execute("delete from issue_fts where issue_id = ?1", [issue_id])
        .map_err(|err| err.to_string())?;
    conn.execute("delete from issue_vectors where issue_id = ?1", [issue_id])
        .map_err(|err| err.to_string())?;
    conn.execute("delete from issues where id = ?1", [issue_id])
        .map_err(|err| err.to_string())?;
    Ok(())
}

fn merged_finding_text(
    existing_text: &str,
    new_text: &str,
    preserve_existing_text: bool,
) -> String {
    if !preserve_existing_text {
        return new_text.to_string();
    }

    let existing_text = existing_text.trim();
    let new_text = new_text.trim();
    if existing_text.is_empty() {
        return new_text.to_string();
    }
    if new_text.is_empty() || existing_text == new_text || existing_text.contains(new_text) {
        return existing_text.to_string();
    }
    if new_text.contains(existing_text) {
        return new_text.to_string();
    }
    format!("{existing_text}\n\n{new_text}")
}

fn merged_decision_text(
    existing_decision: &str,
    new_decision: &str,
    preserve_existing_text: bool,
) -> String {
    let existing_decision = existing_decision.trim();
    let new_decision = new_decision.trim();
    if preserve_existing_text && new_decision.is_empty() && !existing_decision.is_empty() {
        return existing_decision.to_string();
    }
    new_decision.to_string()
}

fn normalize_status(raw: &str) -> String {
    let lowered = raw.trim().to_lowercase();
    match lowered.as_str() {
        "adopted" => "fixed".to_string(),
        "scoped" => "deferred".to_string(),
        other => other.to_string(),
    }
}

fn normalize_token(raw: &str) -> String {
    raw.trim().to_lowercase().replace('_', "-")
}

fn is_material_priority(priority: &str) -> bool {
    matches!(priority, "p0" | "p1" | "critical" | "high")
}

fn is_material_impact(impact: &str) -> bool {
    is_user_visible_or_workflow_impact(impact) || is_security_data_permission_impact(impact)
}

fn is_user_visible_or_workflow_impact(impact: &str) -> bool {
    matches!(
        normalize_token(impact).as_str(),
        "ui" | "ux"
            | "workflow"
            | "user-workflow"
            | "behavior"
            | "route-behavior"
            | "api-contract"
            | "contract"
            | "product"
    )
}

fn is_security_data_permission_impact(impact: &str) -> bool {
    matches!(
        normalize_token(impact).as_str(),
        "permission"
            | "permissions"
            | "auth"
            | "authorization"
            | "privacy"
            | "security"
            | "finance"
            | "billing"
            | "payroll"
            | "data"
            | "data-correctness"
            | "audit"
            | "history"
            | "migration"
            | "schema"
    )
}

fn is_material_closeout_finding(finding: &CloseoutFinding) -> bool {
    finding.material
        || is_material_impact(&finding.impact)
        || is_material_priority(&finding.priority)
}

fn query_issues(
    conn: &Connection,
    query: &str,
    limit: usize,
    filters: &QueryFilters<'_>,
) -> Result<Vec<QueryResult>, String> {
    let query_vector = vectorize(query);
    let run_scope = latest_query_run_id(conn, filters)?;
    if matches!(
        (&filters.repo, &filters.branch, &filters.target),
        (Some(_), Some(_), Some(_))
    ) && run_scope.is_none()
    {
        return Ok(Vec::new());
    }
    let lexical_scores = fts_scores(conn, query, filters, run_scope.as_deref())?;
    let mut where_parts = Vec::new();
    let mut values = Vec::new();
    if let Some(run_id) = &run_scope {
        where_parts.push("issues.run_id = ?");
        values.push(run_id.clone());
    } else if let Some(repo_key) = filters.repo_key {
        where_parts.push("review_runs.repo_key = ?");
        values.push(repo_key.to_string());
    } else if let Some(repo) = filters.repo {
        where_parts.push("review_runs.repo_name = ?");
        values.push(repo.to_string());
    }
    if run_scope.is_none() {
        if let Some(branch) = filters.branch {
            where_parts.push("review_runs.branch = ?");
            values.push(branch.to_string());
        }
        if let Some(target) = filters.target {
            where_parts.push("review_runs.target = ?");
            values.push(target.to_string());
        }
    }
    if let Some(status) = filters.status {
        where_parts.push("issues.status = ?");
        values.push(status.to_string());
    }
    if run_scope.is_none() {
        where_parts.push(latest_issue_filter());
    }
    let where_sql = if where_parts.is_empty() {
        String::new()
    } else {
        format!("where {}", where_parts.join(" and "))
    };
    let sql = format!(
        "select issues.id, issues.decision_id, issues.status, issues.source, issues.fingerprint,
                issues.summary, issues.decision, issues.decision_log_path,
                issues.last_seen_at, issues.seen_count, issues.updated_at,
                review_runs.repo_name, review_runs.branch, review_runs.target, review_runs.head,
                issue_vectors.vector_json
         from issues
         join review_runs on review_runs.id = issues.run_id
         join issue_vectors on issue_vectors.issue_id = issues.id
         {where_sql}"
    );
    let mut stmt = conn.prepare(&sql).map_err(|err| err.to_string())?;
    let rows = stmt
        .query_map(params_from_iter(values.iter()), |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, String>(3)?,
                row.get::<_, String>(4)?,
                row.get::<_, String>(5)?,
                row.get::<_, Option<String>>(6)?.unwrap_or_default(),
                row.get::<_, Option<String>>(7)?.unwrap_or_default(),
                row.get::<_, Option<i64>>(8)?.unwrap_or(0),
                row.get::<_, Option<i64>>(9)?.unwrap_or(1),
                row.get::<_, Option<i64>>(10)?.unwrap_or_else(now_seconds),
                row.get::<_, String>(11)?,
                row.get::<_, Option<String>>(12)?.unwrap_or_default(),
                row.get::<_, String>(13)?,
                row.get::<_, Option<String>>(14)?.unwrap_or_default(),
                row.get::<_, String>(15)?,
            ))
        })
        .map_err(|err| err.to_string())?;

    let timestamp = now_seconds();
    let mut results = Vec::new();
    for row in rows {
        let (
            id,
            decision_id,
            item_status,
            source,
            fingerprint,
            summary,
            decision,
            decision_log_path,
            last_seen_at,
            seen_count,
            updated_at,
            repo_name,
            branch_name,
            target,
            head,
            vector_json,
        ) = row.map_err(|err| err.to_string())?;
        let semantic_score = dot(&query_vector, &decode_vector(&vector_json)?);
        let lexical_score = lexical_scores.get(&id).copied().unwrap_or(0.0);
        if lexical_score <= 0.0 && semantic_score < MIN_SEMANTIC_MATCH_SCORE {
            continue;
        }
        let base_score = semantic_score * 0.72 + lexical_score * 0.28;
        let age_anchor = if last_seen_at > 0 {
            last_seen_at
        } else {
            updated_at
        };
        let age_days = ((timestamp - age_anchor).max(0) as f64) / SECONDS_PER_DAY;
        let recency_factor = 1.0 / (1.0 + (age_days / 30.0));
        let frequency_boost = ((seen_count as f64).ln_1p() / 20.0).min(0.2);
        let score = base_score * recency_factor + frequency_boost;
        results.push(QueryResult {
            id,
            decision_id,
            status: item_status,
            source,
            fingerprint,
            summary,
            decision,
            repo: repo_name,
            branch: branch_name,
            target,
            head,
            score: round6(score),
            semantic_score: round6(semantic_score),
            lexical_score: round6(lexical_score),
            last_seen_at,
            seen_count,
            decision_log_path,
        });
    }
    results.sort_by(|left, right| {
        right
            .score
            .partial_cmp(&left.score)
            .unwrap_or(std::cmp::Ordering::Equal)
    });
    results.truncate(limit);
    touch_issues(conn, &results)?;
    Ok(results)
}

fn latest_query_run_id(
    conn: &Connection,
    filters: &QueryFilters<'_>,
) -> Result<Option<String>, String> {
    match (filters.repo, filters.branch, filters.target) {
        (Some(repo), Some(branch), Some(target)) => latest_closeout_run_id(
            conn,
            repo,
            filters.repo_key,
            Some(branch),
            Some(target),
            None,
        ),
        _ => Ok(None),
    }
}

fn fts_scores(
    conn: &Connection,
    query: &str,
    filters: &QueryFilters<'_>,
    run_scope: Option<&str>,
) -> Result<HashMap<String, f64>, String> {
    let expression = fts_expression(query);
    if expression.is_empty() {
        return Ok(HashMap::new());
    }
    let mut where_parts = vec!["issue_fts match ?"];
    let mut values = vec![expression];
    if let Some(run_id) = run_scope {
        where_parts.push("issues.run_id = ?");
        values.push(run_id.to_string());
    } else if let Some(repo_key) = filters.repo_key {
        where_parts.push("review_runs.repo_key = ?");
        values.push(repo_key.to_string());
    } else if let Some(repo) = filters.repo {
        where_parts.push("review_runs.repo_name = ?");
        values.push(repo.to_string());
    }
    if run_scope.is_none() {
        if let Some(branch) = filters.branch {
            where_parts.push("review_runs.branch = ?");
            values.push(branch.to_string());
        }
        if let Some(target) = filters.target {
            where_parts.push("review_runs.target = ?");
            values.push(target.to_string());
        }
    }
    if let Some(status) = filters.status {
        where_parts.push("issues.status = ?");
        values.push(status.to_string());
    }
    let sql = format!(
        "select issues.id, bm25(issue_fts) as rank
         from issue_fts
         join issues on issues.id = issue_fts.issue_id
         join review_runs on review_runs.id = issues.run_id
         where {}
         order by rank
         limit 200",
        where_parts.join(" and ")
    );
    let mut stmt = conn.prepare(&sql).map_err(|err| err.to_string())?;
    let rows = match stmt.query_map(params_from_iter(values.iter()), |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, f64>(1)?))
    }) {
        Ok(rows) => rows,
        Err(_) => return Ok(HashMap::new()),
    };
    let mut scores = HashMap::new();
    for row in rows {
        let (id, rank) = row.map_err(|err| err.to_string())?;
        scores.insert(id, 1.0 / (1.0 + rank.abs()));
    }
    Ok(scores)
}

fn build_closeout(
    conn: &Connection,
    repo: &str,
    repo_key: Option<&str>,
    branch: Option<&str>,
    target: Option<&str>,
    base: Option<&str>,
) -> Result<Closeout, String> {
    let Some(run_id) = latest_closeout_run_id(conn, repo, repo_key, branch, target, base)? else {
        return Ok(Closeout {
            material_findings: Vec::new(),
            user_visible_or_workflow_changes: Vec::new(),
            security_data_permission_changes: Vec::new(),
            lower_risk_findings: Vec::new(),
            findings_found: Vec::new(),
            changes_made_while_reviewing: Vec::new(),
            verification_run: Vec::new(),
            still_open: Vec::new(),
        });
    };
    let mut stmt = conn
        .prepare(
            "select decision_id, status, source, summary,
                    coalesce(impact, ''), coalesce(priority, ''),
                    coalesce(material, 0), coalesce(user_impact, ''),
                    decision, fingerprint
             from issues
             where run_id = ?1
             order by decision_id",
        )
        .map_err(|err| err.to_string())?;
    let findings = stmt
        .query_map([&run_id], |row| {
            Ok(CloseoutFinding {
                decision_id: row.get(0)?,
                status: row.get(1)?,
                source: row.get(2)?,
                summary: row.get(3)?,
                impact: row.get(4)?,
                priority: row.get(5)?,
                material: row.get::<_, i64>(6)? != 0,
                user_impact: row.get(7)?,
                decision: row.get::<_, Option<String>>(8)?.unwrap_or_default(),
                fingerprint: row.get(9)?,
            })
        })
        .map_err(|err| err.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|err| err.to_string())?;

    let run_ids = vec![run_id];
    let verification = recorded_commands(conn, &run_ids)?;
    let changes = findings
        .iter()
        .filter(|finding| finding.status == "fixed")
        .cloned()
        .collect();
    let material_findings = findings
        .iter()
        .filter(|finding| is_material_closeout_finding(finding))
        .cloned()
        .collect();
    let user_visible_or_workflow_changes = findings
        .iter()
        .filter(|finding| is_user_visible_or_workflow_impact(&finding.impact))
        .cloned()
        .collect();
    let security_data_permission_changes = findings
        .iter()
        .filter(|finding| is_security_data_permission_impact(&finding.impact))
        .cloned()
        .collect();
    let lower_risk_findings = findings
        .iter()
        .filter(|finding| !is_material_closeout_finding(finding))
        .cloned()
        .collect();
    let still_open = findings
        .iter()
        .filter(|finding| {
            matches!(
                finding.status.as_str(),
                "open" | "deferred" | "provisional" | "reopened"
            )
        })
        .cloned()
        .collect();
    Ok(Closeout {
        material_findings,
        user_visible_or_workflow_changes,
        security_data_permission_changes,
        lower_risk_findings,
        findings_found: findings,
        changes_made_while_reviewing: changes,
        verification_run: verification,
        still_open,
    })
}

fn latest_issue_filter() -> &'static str {
    "not exists (
       select 1
       from issues newer
       join review_runs newer_runs on newer_runs.id = newer.run_id
         where newer.decision_id = issues.decision_id
           and newer_runs.repo_name = review_runs.repo_name
           and newer_runs.repo_key = review_runs.repo_key
           and coalesce(newer_runs.branch, '') = coalesce(review_runs.branch, '')
           and newer_runs.target = review_runs.target
           and (
             newer.updated_at > issues.updated_at
             or (newer.updated_at = issues.updated_at and newer.rowid > issues.rowid)
           )
     )"
}

fn latest_closeout_run_id(
    conn: &Connection,
    repo: &str,
    repo_key: Option<&str>,
    branch: Option<&str>,
    target: Option<&str>,
    base: Option<&str>,
) -> Result<Option<String>, String> {
    let mut where_parts = Vec::new();
    let mut values = Vec::new();
    if let Some(repo_key) = repo_key {
        where_parts.push("repo_key = ?");
        values.push(repo_key.to_string());
    } else {
        where_parts.push("repo_name = ?");
        values.push(repo.to_string());
    }
    if let Some(branch) = branch {
        where_parts.push("branch = ?");
        values.push(branch.to_string());
    }
    if let Some(target) = target {
        where_parts.push("target = ?");
        values.push(target.to_string());
    }
    if let Some(base) = base {
        where_parts.push("coalesce(base, '') = ?");
        values.push(base.to_string());
    }
    let sql = format!(
        "select id
         from review_runs
         where {}
         order by update_seq desc, updated_at desc, rowid desc
         limit 1",
        where_parts.join(" and ")
    );
    conn.query_row(&sql, params_from_iter(values.iter()), |row| {
        row.get::<_, String>(0)
    })
    .optional()
    .map_err(|err| err.to_string())
}

fn recorded_commands(
    conn: &Connection,
    run_ids: &[String],
) -> Result<Vec<RecordedCommand>, String> {
    let mut commands = Vec::new();
    for run_id in run_ids {
        let mut stmt = conn
            .prepare(
                "select command, result, reason, coalesce(decision_id, '')
                 from commands
                 where run_id = ?1
                 order by updated_at, command",
            )
            .map_err(|err| err.to_string())?;
        let rows = stmt
            .query_map([run_id], |row| {
                Ok(RecordedCommand {
                    command: row.get(0)?,
                    result: row.get(1)?,
                    reason: row.get(2)?,
                    decision_id: row.get(3)?,
                })
            })
            .map_err(|err| err.to_string())?;
        for row in rows {
            commands.push(row.map_err(|err| err.to_string())?);
        }
    }
    Ok(commands)
}

fn print_closeout(closeout: &Closeout, json: bool, material_only: bool) -> Result<(), String> {
    if json {
        println!(
            "{}",
            serde_json::to_string_pretty(closeout).map_err(|err| err.to_string())?
        );
        return Ok(());
    }
    print_finding_section("Material findings", &closeout.material_findings, true);
    println!();
    print_finding_section(
        "User-visible or workflow changes",
        &closeout.user_visible_or_workflow_changes,
        true,
    );
    println!();
    print_finding_section(
        "Security, data, and permission changes",
        &closeout.security_data_permission_changes,
        true,
    );
    println!();
    if !material_only {
        print_finding_section("Lower-risk findings", &closeout.lower_risk_findings, false);
        println!();
    }
    if material_only {
        print_verification_section(&closeout.verification_run);
        println!();
        print_still_open_section(&closeout.still_open);
        return Ok(());
    }
    println!("Findings found");
    if closeout.findings_found.is_empty() {
        println!("- none recorded");
    } else {
        for finding in &closeout.findings_found {
            println!(
                "- {} [{}] {}: {}",
                finding.decision_id, finding.status, finding.source, finding.summary
            );
        }
    }
    println!();
    println!("Changes made while reviewing");
    if closeout.changes_made_while_reviewing.is_empty() {
        println!("- none recorded");
    } else {
        for finding in &closeout.changes_made_while_reviewing {
            println!("- {}: {}", finding.decision_id, finding.decision);
        }
    }
    println!();
    println!("Verification run");
    print_verification_items(&closeout.verification_run);
    println!();
    print_still_open_section(&closeout.still_open);
    Ok(())
}

fn print_finding_section(title: &str, findings: &[CloseoutFinding], show_context: bool) {
    println!("{title}");
    if findings.is_empty() {
        println!("- none recorded");
        return;
    }
    for finding in findings {
        let mut context = Vec::new();
        if !finding.impact.is_empty() {
            context.push(finding.impact.clone());
        }
        if !finding.priority.is_empty() {
            context.push(finding.priority.clone());
        }
        let context = if context.is_empty() {
            String::new()
        } else {
            format!(" [{}]", context.join(", "))
        };
        println!(
            "- {} [{}] {}{}: {}",
            finding.decision_id, finding.status, finding.source, context, finding.summary
        );
        if show_context && !finding.user_impact.is_empty() {
            println!("  why it matters: {}", finding.user_impact);
        }
        if show_context && finding.status == "fixed" && !finding.decision.is_empty() {
            println!("  change: {}", finding.decision);
        }
    }
}

fn print_verification_section(commands: &[RecordedCommand]) {
    println!("Verification run");
    print_verification_items(commands);
}

fn print_verification_items(commands: &[RecordedCommand]) {
    if commands.is_empty() {
        println!("- none recorded");
        return;
    }
    for command in commands {
        let id = if command.decision_id.is_empty() {
            String::new()
        } else {
            format!(" ({})", command.decision_id)
        };
        println!(
            "- `{}` -> {}{}: {}",
            command.command, command.result, id, command.reason
        );
    }
}

fn print_still_open_section(findings: &[CloseoutFinding]) {
    println!("Still open");
    if findings.is_empty() {
        println!("- none recorded");
        return;
    }
    for finding in findings {
        println!(
            "- {} [{}]: {}",
            finding.decision_id, finding.status, finding.summary
        );
        if !finding.user_impact.is_empty() {
            println!("  why it matters: {}", finding.user_impact);
        }
    }
}

fn prune_findings(
    conn: &Connection,
    older_than_days: f64,
    min_seen_count: i64,
    filters: &PruneFilters<'_>,
) -> Result<usize, String> {
    let cutoff = now_seconds() - (older_than_days * SECONDS_PER_DAY) as i64;
    let mut where_parts = vec!["issues.last_seen_at < ?", "issues.seen_count <= ?"];
    let mut values = vec![cutoff.to_string(), min_seen_count.to_string()];
    if !filters.include_open {
        where_parts.push("issues.status not in ('open', 'deferred', 'provisional', 'reopened')");
    }
    if let Some(repo_key) = filters.repo_key {
        where_parts.push("review_runs.repo_key = ?");
        values.push(repo_key.to_string());
    } else if let Some(repo) = filters.repo {
        where_parts.push("review_runs.repo_name = ?");
        values.push(repo.to_string());
    }
    if let Some(branch) = filters.branch {
        where_parts.push("review_runs.branch = ?");
        values.push(branch.to_string());
    }
    let sql = format!(
        "select issues.id
         from issues
         join review_runs on review_runs.id = issues.run_id
         where {}",
        where_parts.join(" and ")
    );
    let mut stmt = conn.prepare(&sql).map_err(|err| err.to_string())?;
    let issue_ids = stmt
        .query_map(params_from_iter(values.iter()), |row| {
            row.get::<_, String>(0)
        })
        .map_err(|err| err.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|err| err.to_string())?;
    if filters.dry_run || issue_ids.is_empty() {
        return Ok(issue_ids.len());
    }
    for issue_id in &issue_ids {
        conn.execute("delete from issue_fts where issue_id = ?1", [issue_id])
            .map_err(|err| err.to_string())?;
        conn.execute("delete from issue_vectors where issue_id = ?1", [issue_id])
            .map_err(|err| err.to_string())?;
        conn.execute("delete from issues where id = ?1", [issue_id])
            .map_err(|err| err.to_string())?;
    }
    conn.execute(
        "delete from review_runs
         where id not in (select distinct run_id from issues)
           and id not in (select distinct run_id from commands)",
        [],
    )
    .map_err(|err| err.to_string())?;
    Ok(issue_ids.len())
}

fn print_results(results: &[QueryResult], json: bool, show_paths: bool) -> Result<(), String> {
    if json {
        println!(
            "{}",
            serde_json::to_string_pretty(results).map_err(|err| err.to_string())?
        );
        return Ok(());
    }
    if results.is_empty() {
        println!("No findings matched.");
        return Ok(());
    }
    for result in results {
        println!(
            "{} [{}] score={} repo={} branch={} target={}",
            result.decision_id,
            result.status,
            result.score,
            result.repo,
            result.branch,
            result.target
        );
        println!("  {}", result.summary);
        if !result.fingerprint.is_empty() {
            println!("  fingerprint: {}", result.fingerprint);
        }
        if show_paths && !result.decision_log_path.is_empty() {
            println!("  decision log: {}", result.decision_log_path);
        }
    }
    Ok(())
}

fn touch_issues(conn: &Connection, results: &[QueryResult]) -> Result<(), String> {
    if results.is_empty() {
        return Ok(());
    }
    let timestamp = now_seconds();
    for result in results {
        conn.execute(
            "update issues set last_seen_at = ?1, seen_count = seen_count + 1 where id = ?2",
            params![timestamp, result.id],
        )
        .map_err(|err| err.to_string())?;
    }
    Ok(())
}

fn tokenize(text: &str) -> Vec<String> {
    let re = Regex::new(r"[a-z0-9][a-z0-9_.:/#-]*").expect("token regex should compile");
    let mut tokens = Vec::new();
    for found in re.find_iter(&text.to_lowercase()) {
        let token = found
            .as_str()
            .trim_matches(['.', '_', ':', '/', '#', '-'])
            .to_string();
        if token.is_empty() {
            continue;
        }
        tokens.push(token.clone());
        tokens.extend(synonyms(&token).into_iter().map(str::to_string));
        if token.len() > 4 && token.ends_with('s') {
            tokens.push(token[..token.len() - 1].to_string());
        }
        if token.len() > 5 && token.ends_with("ed") {
            tokens.push(token[..token.len() - 2].to_string());
        }
        if token.len() > 6 && token.ends_with("ing") {
            tokens.push(token[..token.len() - 3].to_string());
        }
    }
    tokens
}

fn synonyms(token: &str) -> Vec<&'static str> {
    match token {
        "auth" => vec!["authorization", "permission", "access", "login"],
        "authorization" => vec!["auth", "permission", "access"],
        "block" => vec!["prevent", "deny", "stop"],
        "broken" => vec!["bug", "failure", "regression"],
        "crash" => vec!["exception", "failure", "panic"],
        "double" => vec![
            "duplicate",
            "duplicated",
            "twice",
            "two",
            "repeated",
            "multiple",
        ],
        "duplicate" => vec!["double", "duplicated", "twice", "repeated", "multiple"],
        "invoice" => vec!["billing", "payment", "charge"],
        "leak" => vec!["expose", "disclose", "access"],
        "payment" => vec!["refund", "invoice", "billing", "charge", "provider"],
        "permission" => vec!["auth", "authorization", "access"],
        "refund" => vec!["reversal", "reimbursement", "payment", "provider"],
        "reversal" => vec!["refund", "reimbursement", "payment"],
        "tenant" => vec!["workspace", "customer", "organization", "org"],
        _ => Vec::new(),
    }
}

fn vectorize(text: &str) -> Vec<(usize, f64)> {
    let mut weights: HashMap<usize, f64> = HashMap::new();
    for token in tokenize(text) {
        add_feature(&mut weights, &token, 1.0);
        for trigram in trigrams(&token) {
            add_feature(&mut weights, &format!("tri:{trigram}"), 0.35);
        }
    }
    let length = weights
        .values()
        .map(|value| value * value)
        .sum::<f64>()
        .sqrt();
    if length == 0.0 {
        return Vec::new();
    }
    let mut vector = weights
        .into_iter()
        .map(|(index, value)| (index, value / length))
        .collect::<Vec<_>>();
    vector.sort_by_key(|(index, _)| *index);
    vector
}

fn trigrams(token: &str) -> Vec<String> {
    let padded = format!("  {token} ");
    let chars = padded.chars().collect::<Vec<_>>();
    if chars.len() < 3 {
        return vec![padded];
    }
    (0..=chars.len() - 3)
        .map(|index| chars[index..index + 3].iter().collect())
        .collect()
}

fn add_feature(weights: &mut HashMap<usize, f64>, feature: &str, amount: f64) {
    let digest = Sha256::digest(feature.as_bytes());
    let mut bytes = [0_u8; 8];
    bytes.copy_from_slice(&digest[..8]);
    let raw = u64::from_be_bytes(bytes);
    let index = raw as usize % VECTOR_DIMENSIONS;
    let sign = if digest[8] & 1 == 1 { 1.0 } else { -1.0 };
    *weights.entry(index).or_insert(0.0) += amount * sign;
}

fn decode_vector(raw: &str) -> Result<Vec<(usize, f64)>, String> {
    serde_json::from_str(raw).map_err(|err| err.to_string())
}

fn dot(left: &[(usize, f64)], right: &[(usize, f64)]) -> f64 {
    let right_map = right.iter().copied().collect::<HashMap<_, _>>();
    left.iter()
        .map(|(index, value)| value * right_map.get(index).copied().unwrap_or(0.0))
        .sum()
}

fn fts_expression(query: &str) -> String {
    let mut seen = HashSet::new();
    let mut tokens = Vec::new();
    let split_re = Regex::new(r"[^a-z0-9_]+").expect("split regex should compile");
    for token in tokenize(query) {
        let lowered = token.to_lowercase();
        for cleaned in split_re.split(&lowered) {
            if !cleaned.is_empty() && seen.insert(cleaned.to_string()) {
                tokens.push(cleaned.to_string());
            }
            if tokens.len() >= 24 {
                break;
            }
        }
        if tokens.len() >= 24 {
            break;
        }
    }
    tokens.join(" OR ")
}

fn resolve_query_repo(repo: Option<String>, all_repos: bool) -> Result<Option<String>, String> {
    if all_repos {
        return Ok(repo);
    }
    if repo.is_some() {
        return Ok(repo);
    }
    infer_current_repo_name().map(Some).ok_or_else(|| {
        "query needs --repo or --all-repos when the current repo cannot be inferred".to_string()
    })
}

fn resolve_query_branch(
    branch: Option<String>,
    all_branches: bool,
) -> Result<Option<String>, String> {
    if all_branches || branch.is_some() {
        return Ok(branch);
    }
    infer_current_branch().map(Some).ok_or_else(|| {
        "query needs --branch or --all-branches when the current branch cannot be inferred"
            .to_string()
    })
}

fn resolve_query_repo_key(repo: Option<&str>, repo_path: Option<&str>) -> Option<String> {
    if let Some(repo_path) = repo_path.filter(|value| !value.is_empty()) {
        return Some(repo_key_from_path(Path::new(repo_path)));
    }

    let current_repo = infer_current_repo_name();
    match (repo, current_repo.as_deref()) {
        (Some(repo), Some(current)) if repo == current => infer_current_repo_key(),
        (None, Some(_)) => infer_current_repo_key(),
        _ => None,
    }
}

fn infer_current_repo_name() -> Option<String> {
    let cwd = env::current_dir().ok()?;
    run_git(&cwd, &["rev-parse", "--show-toplevel"])
        .ok()
        .and_then(|root| {
            PathBuf::from(root)
                .file_name()
                .map(|name| name.to_string_lossy().to_string())
        })
}

fn infer_current_repo_key() -> Option<String> {
    let cwd = env::current_dir().ok()?;
    Some(repo_key_from_path(&cwd))
}

fn infer_current_branch() -> Option<String> {
    let cwd = env::current_dir().ok()?;
    let branch = run_git(&cwd, &["branch", "--show-current"]).ok()?;
    if branch.is_empty() {
        None
    } else {
        Some(branch)
    }
}

fn stable_id(parts: &[&str]) -> String {
    let mut hasher = Sha256::new();
    for part in parts {
        hasher.update(part.as_bytes());
        hasher.update([0]);
    }
    hex_prefix(&hasher.finalize(), 16)
}

fn content_hash(text: &str) -> String {
    let digest = Sha256::digest(text.as_bytes());
    hex_prefix(&digest, 64)
}

fn hex_prefix(bytes: &[u8], chars: usize) -> String {
    bytes
        .iter()
        .flat_map(|byte| [byte >> 4, byte & 0x0f])
        .take(chars)
        .map(|nibble| char::from_digit(nibble as u32, 16).unwrap())
        .collect()
}

fn now_seconds() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64
}

fn repo_key_from_path(path: &Path) -> String {
    let cwd = if path.is_dir() {
        path
    } else {
        path_context_dir(path)
    };
    if let Ok(common_dir) = run_git(
        cwd,
        &["rev-parse", "--path-format=absolute", "--git-common-dir"],
    ) {
        return canonical_string(Path::new(&common_dir));
    }
    canonical_string(cwd)
}

fn canonical_string(path: &Path) -> String {
    path.canonicalize()
        .unwrap_or_else(|_| path.to_path_buf())
        .to_string_lossy()
        .to_string()
}

fn path_context_dir(path: &Path) -> &Path {
    path.parent()
        .filter(|parent| !parent.as_os_str().is_empty())
        .unwrap_or_else(|| Path::new("."))
}

fn run_git(cwd: &Path, args: &[&str]) -> Result<String, String> {
    let git = trusted_git(cwd)?;
    let output = Command::new(git)
        .args(args)
        .current_dir(cwd)
        .output()
        .map_err(|err| err.to_string())?;
    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).trim().to_string());
    }
    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}

fn trusted_git(cwd: &Path) -> Result<PathBuf, String> {
    if let Ok(configured) = env::var("AGENT_REVIEW_FINDINGS_GIT") {
        let path = PathBuf::from(configured);
        if path.is_absolute() && path.is_file() {
            return Ok(path);
        }
    }

    for candidate in [
        "/usr/bin/git",
        "/opt/homebrew/bin/git",
        "/usr/local/bin/git",
    ] {
        let path = PathBuf::from(candidate);
        if path.is_file() {
            return Ok(path);
        }
    }

    let exclusion_root = trusted_path_exclusion_root(cwd);
    for entry in env::var_os("PATH")
        .map(|paths| env::split_paths(&paths).collect::<Vec<_>>())
        .unwrap_or_default()
    {
        if !entry.is_absolute() {
            continue;
        }
        let entry = entry.canonicalize().unwrap_or(entry);
        if entry.starts_with(&exclusion_root) {
            continue;
        }
        let candidate = entry.join("git");
        let candidate = candidate.canonicalize().unwrap_or(candidate);
        if candidate.starts_with(&exclusion_root) {
            continue;
        }
        if candidate.is_file() {
            return Ok(candidate);
        }
    }

    Err("trusted git executable not found".to_string())
}

fn trusted_path_exclusion_root(cwd: &Path) -> PathBuf {
    let cwd = cwd.canonicalize().unwrap_or_else(|_| cwd.to_path_buf());
    for ancestor in cwd.ancestors() {
        if ancestor.join(".git").exists() {
            return ancestor.to_path_buf();
        }
    }
    cwd
}

fn join_nonempty(parts: &[&str]) -> String {
    parts
        .iter()
        .filter(|part| !part.is_empty())
        .copied()
        .collect::<Vec<_>>()
        .join("\n")
}

fn round6(value: f64) -> f64 {
    (value * 1_000_000.0).round() / 1_000_000.0
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn trusted_git_exclusion_root_uses_worktree_root_from_subdirectory() {
        let unique = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_nanos();
        let root = env::temp_dir().join(format!(
            "review-findings-trusted-git-{}-{unique}",
            std::process::id()
        ));
        let subdir = root.join("nested").join("child");
        fs::create_dir_all(&subdir).expect("create nested test repo");
        fs::create_dir_all(root.join(".git")).expect("create git marker");

        let exclusion_root = trusted_path_exclusion_root(&subdir);

        assert_eq!(
            exclusion_root,
            root.canonicalize().expect("canonical test repo")
        );
        fs::remove_dir_all(root).expect("remove test repo");
    }
}
