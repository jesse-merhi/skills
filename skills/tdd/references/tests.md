# Good And Bad Tests

## Good Tests

Integration-style tests go through real interfaces, not mocks of internal parts.

```typescript
test("user can checkout with valid cart", async () => {
  const cart = createCart();
  cart.add(product);
  const result = await checkout(cart, paymentMethod);
  expect(result.status).toBe("confirmed");
});
```

Good tests:

- test behavior users or callers care about;
- use public APIs;
- survive internal refactors;
- describe what, not how;
- carry one logical assertion.

## Bad Tests

Implementation-detail tests couple to internal structure.

```typescript
test("checkout calls paymentService.process", async () => {
  const mockPayment = jest.mock(paymentService);
  await checkout(cart, payment);
  expect(mockPayment.process).toHaveBeenCalledWith(cart.total);
});
```

Red flags:

- mocking internal collaborators;
- testing private methods;
- asserting call counts or call order;
- breaking on refactor without behavior change;
- naming how the code works instead of what behavior exists.

Tautological tests restate the implementation, so they pass by construction.

```typescript
test("calculateTotal sums line items", () => {
  const items = [{ price: 10 }, { price: 5 }];
  const expected = items.reduce((sum, item) => sum + item.price, 0);
  expect(calculateTotal(items)).toBe(expected);
});
```

Use independent expected values instead.

```typescript
test("calculateTotal sums line items", () => {
  expect(calculateTotal([{ price: 10 }, { price: 5 }])).toBe(15);
});
```
