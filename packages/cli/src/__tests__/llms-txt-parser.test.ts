import { describe, it, expect, vi, beforeEach } from 'vitest'
import { parseLlmsTxt, detectVersion } from '../repository/llms-txt-parser.js'

describe('parseLlmsTxt', () => {
  it('extracts title, url, description from a standard line', () => {
    const text = '- [결제 가이드](https://docs.tosspayments.com/guides/v2/payment.md): 결제 연동 가이드'
    const results = parseLlmsTxt(text)
    expect(results).toHaveLength(1)
    expect(results[0].title).toBe('결제 가이드')
    expect(results[0].url).toBe('https://docs.tosspayments.com/guides/v2/payment.md')
    expect(results[0].description).toBe('결제 연동 가이드')
  })

  it('parses multiple lines producing correct document count', () => {
    const text = [
      '- [Doc 1](https://example.com/v1/a.md): First doc',
      '- [Doc 2](https://example.com/v2/b.md): Second doc',
      '- [Doc 3](https://example.com/c.md): Third doc',
    ].join('\n')
    const results = parseLlmsTxt(text)
    expect(results).toHaveLength(3)
  })

  it('skips malformed lines gracefully', () => {
    const text = ['- [Valid](https://example.com/v2/good.md): Good', 'not a valid line', '## Header line'].join('\n')
    const results = parseLlmsTxt(text)
    expect(results).toHaveLength(1)
  })
})

describe('detectVersion', () => {
  it('detects v1 from URL containing /v1/', () => {
    expect(detectVersion('https://docs.tosspayments.com/guides/v1/billing.md')).toBe('v1')
  })

  it('detects v2 from URL containing /v2/', () => {
    expect(detectVersion('https://docs.tosspayments.com/guides/v2/payment.md')).toBe('v2')
  })

  it('returns undefined for URL without version', () => {
    expect(detectVersion('https://docs.tosspayments.com/reference/index.md')).toBeUndefined()
  })
})
