# When To Mock

Mock at system boundaries only:

- external APIs;
- databases, when a test database is not practical;
- time and randomness;
- the file system, when real files are too slow or brittle.

Do not mock:

- your own classes or modules;
- internal collaborators;
- behavior the ticket is supposed to prove.

## Designing For Mockability

At system boundaries, design interfaces that are easy to mock. Pass external
dependencies in rather than creating them internally.

```typescript
function processPayment(order, paymentClient) {
  return paymentClient.charge(order.total);
}
```

Prefer specific SDK-style functions over generic fetchers with conditional
logic. Each mock should return one specific shape and make it obvious which
external operation the test exercises.
