import { emailVerificationEmail, passwordResetEmail } from '../account-links'
import { withQuery } from '../context'
import { escapeHtml, formatMoney, toNumber } from '../html'
import { orderConfirmationEmail } from '../order-confirmation'
import { orderShippedEmail } from '../order-shipped'

const address = {
  first_name: 'Sam',
  last_name: 'Tester',
  address_1: '1 Test Street',
  city: 'London',
  postal_code: 'N1 1AA',
  country_code: 'gb',
}

const order = {
  display_id: 7,
  currency_code: 'gbp',
  items: [
    { product_title: 'Wool jacket', variant_title: 'Default variant', quantity: 1, total: 60 },
    { product_title: 'Tie', variant_title: 'Navy', quantity: 2, total: 20 },
  ],
  shipping_address: address,
  shipping_methods: [{ name: 'Standard UK delivery' }],
  shipping_total: 5,
  discount_total: 0,
  tax_total: 14.17,
  total: 85,
}

describe('html helpers', () => {
  it('escapes markup', () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;'
    )
  })

  it('formats amounts as stored, without dividing by 100', () => {
    expect(formatMoney(65, 'gbp')).toBe('£65.00')
    expect(formatMoney('10.833', 'gbp')).toBe('£10.83')
  })

  it('reads BigNumber-like values and treats missing ones as zero', () => {
    expect(toNumber({ valueOf: () => 12.5 })).toBe(12.5)
    expect(toNumber(null)).toBe(0)
    expect(toNumber('not a number')).toBe(0)
  })

  it('encodes query parameters', () => {
    expect(withQuery('https://shop.test/reset-password', { token: 'a+b/c', email: 'a+b@x.test' })).toBe(
      'https://shop.test/reset-password?token=a%2Bb%2Fc&email=a%2Bb%40x.test'
    )
  })
})

describe('orderConfirmationEmail', () => {
  it('lists items, totals with VAT, and the delivery address', () => {
    const email = orderConfirmationEmail({ storeName: 'Test Shop', order })

    expect(email.subject).toBe('Order #7 confirmed')
    expect(email.html).toContain('Test Shop')
    expect(email.html).toContain('Wool jacket</td>')
    expect(email.html).toContain('Tie (Navy) &times; 2')
    expect(email.html).toContain('Delivery (Standard UK delivery)')
    expect(email.html).toContain('£85.00')
    expect(email.html).toContain('Includes VAT of')
    expect(email.html).toContain('£14.17')
    expect(email.html).toContain('N1 1AA<br>GB')
    expect(email.html).not.toContain('Discount')
    expect(email.html).not.toContain('View your order')
    expect(email.text).toContain('Tie (Navy) x 2: £20.00')
    expect(email.text).toContain('Total: £85.00')
  })

  it('links registered customers to their order and shows discounts', () => {
    const email = orderConfirmationEmail({
      storeName: 'Test Shop',
      orderUrl: 'https://shop.test/account/orders/details/order_1',
      order: { ...order, discount_total: 10 },
    })

    expect(email.html).toContain('href="https://shop.test/account/orders/details/order_1"')
    expect(email.html).toContain('-£10.00')
    expect(email.text).toContain('View your order: https://shop.test/account/orders/details/order_1')
  })

  it('escapes customer-supplied text', () => {
    const email = orderConfirmationEmail({
      storeName: 'Test Shop',
      order: { ...order, shipping_address: { ...address, address_1: '<script>x</script>' } },
    })

    expect(email.html).not.toContain('<script>')
    expect(email.html).toContain('&lt;script&gt;')
  })
})

describe('orderShippedEmail', () => {
  it('lists items and tracking', () => {
    const email = orderShippedEmail({
      storeName: 'Test Shop',
      order: { display_id: 7 },
      items: [{ title: 'Wool jacket', quantity: 1 }],
      trackingLinks: [{ tracking_number: 'TRK1', tracking_url: 'https://track.test/TRK1' }],
      address,
    })

    expect(email.subject).toBe('Order #7 has shipped')
    expect(email.html).toContain('<li>Wool jacket</li>')
    expect(email.html).toContain('href="https://track.test/TRK1"')
    expect(email.text).toContain('TRK1 https://track.test/TRK1')
  })

  it('leaves out tracking when there is none', () => {
    const email = orderShippedEmail({
      storeName: 'Test Shop',
      order: { display_id: 7 },
      items: [],
      trackingLinks: [{ tracking_number: '', tracking_url: '' }],
    })

    expect(email.html).not.toContain('Tracking')
    expect(email.text).not.toContain('Tracking')
  })
})

describe('account link emails', () => {
  it('password reset carries the escaped link in both parts', () => {
    const resetUrl = 'https://shop.test/reset-password?token=abc&email=a%40x.test'
    const email = passwordResetEmail({ storeName: 'Test Shop', resetUrl })

    expect(email.subject).toBe('Reset your Test Shop password')
    expect(email.html).toContain('href="https://shop.test/reset-password?token=abc&amp;email=a%40x.test"')
    expect(email.text).toContain(resetUrl)
    expect(email.text).toContain('15 minutes')
  })

  it('email verification carries the link in both parts', () => {
    const verifyUrl = 'https://shop.test/verify-account?token=abc'
    const email = emailVerificationEmail({ storeName: 'Test Shop', verifyUrl })

    expect(email.subject).toBe('Confirm your email for Test Shop')
    expect(email.html).toContain(`href="${verifyUrl}"`)
    expect(email.text).toContain(verifyUrl)
  })
})
