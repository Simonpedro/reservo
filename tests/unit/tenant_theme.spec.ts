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
    assert.include(css, '--secondary: hsl(94.6 45.1% 57.8%);')
    assert.include(css, '--ring: hsl(215.1 85.6% 59.2%);')
  })
})
