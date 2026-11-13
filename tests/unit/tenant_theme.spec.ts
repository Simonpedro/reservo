import { hexToHsl, tenantThemeCss } from '#services/tenant_theme'
import { test } from '@japa/runner'

test.group('Tenant theme', () => {
  test('converts hex colors to CSS hsl colors', ({ assert }) => {
    assert.equal(hexToHsl('#001A4D'), 'hsl(219.7 100% 15.1%)')
    assert.equal(hexToHsl('#FFFFFF'), 'hsl(0 0% 100%)')
    assert.isNull(hexToHsl('navy'))
  })

  test('maps tenant colors to shadcn variables', ({ assert }) => {
    const css = tenantThemeCss({
      brandBackground: '#001A4D',
      green: '#8CC463',
      lightBlue: '#5AB8F0',
      blue: '#3E88F0',
      accent: '#6EF04A',
    })

    assert.include(css, '--primary: hsl(219.7 100% 15.1%);')
    assert.include(css, '--accent: hsl(107 84.7% 61.6%);')
    assert.include(css, '--ring: hsl(215.1 85.6% 59.2%);')
  })

  test('derives the Píldora washes from the brand colors', ({ assert }) => {
    const css = tenantThemeCss({ brandBackground: '#001A4D', lightBlue: '#5AB8F0' })

    assert.include(css, '--celeste: hsl(202.4 83.3% 64.7%);')
    assert.include(css, '--wash-celeste: hsl(202.4 83.3% 64.7% / 0.17);')
    assert.include(css, '--secondary: hsl(202.4 83.3% 64.7% / 0.16);')
    assert.include(css, '--muted-foreground: hsl(219.7 100% 15.1% / 0.72);')
  })

  test('leaves out the colors a tenant did not set', ({ assert }) => {
    const css = tenantThemeCss({ brandBackground: '#001A4D' })

    assert.notInclude(css, '--celeste')
    assert.notInclude(css, '--wash-green')
    assert.equal(tenantThemeCss(null), '')
  })
})
