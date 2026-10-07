# Durable Lessons

Record only reusable lessons prompted by a real correction or repeated failure. Do not log routine
conversation or one-off preferences.

## Unquoted `#` in an env value is a comment

`process.loadEnvFile` (and dotenv-style parsers) cut an unquoted value at `#`, so a password like
`abc#123` is read as `abc` and login fails with "Invalid email or password". A `.env.template` that
asks for a password should say to quote it. To diagnose without reading secrets, print only derived
facts (length, whether it contains `#`), never the value. (2026-10-07, the e2e admin login.)

## The starter's `data-testid`s are not unique per page

Check a test id's other uses before relying on it: `product-title` also marks the related-products
cards on a product page, `cart-item` is the header dropdown while cart-page rows are `product-row`,
and `register-button` is both the "Join us" link and the register form's submit. Scope with a parent
test id or use a role locator. (2026-10-07, the first e2e run.)

