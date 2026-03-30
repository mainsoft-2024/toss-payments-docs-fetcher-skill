/**
 * 휴리스틱 기반 토큰 추정기
 * Zero dependency로 텍스트의 토큰 수를 추정합니다.
 * 한국어, 영어, 코드가 혼합된 토스페이먼츠 문서에 최적화되어 있습니다.
 */
export class TokenEstimator {
  // 기본 문자당 토큰 비율 (평균적으로 문자 1개당 0.75 토큰)
  private static readonly CHAR_TO_TOKEN_RATIO = 0.75

  // 한국어 가중치 (한국어는 토큰 비율이 높음)
  private static readonly KOREAN_WEIGHT = 0.8

  // 코드 블록 비율 (코드는 토큰 효율이 좋음)
  private static readonly CODE_BLOCK_RATIO = 0.3

  // URL당 평균 토큰 수
  private static readonly URL_TOKENS = 8

  // 인라인 코드 가중치
  private static readonly INLINE_CODE_RATIO = 0.4

  /**
   * 텍스트의 토큰 수를 추정합니다.
   * @param text 토큰 수를 추정할 텍스트
   * @returns 추정된 토큰 수
   */
  static estimate(text: string): number {
    if (!text || text.length === 0) return 0

    let estimate = text.length * this.CHAR_TO_TOKEN_RATIO
    estimate += this.calculateKoreanWeight(text)
    estimate += this.calculateCodeBlockWeight(text)
    estimate += this.calculateInlineCodeWeight(text)
    estimate += this.calculateUrlWeight(text)
    estimate += this.calculateHeaderWeight(text)

    return Math.ceil(Math.max(estimate, 1))
  }

  private static calculateKoreanWeight(text: string): number {
    const koreanChars = (text.match(/[\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F]/g) || []).length
    return koreanChars * this.KOREAN_WEIGHT
  }

  private static calculateCodeBlockWeight(text: string): number {
    const codeBlocks = text.match(/```[\s\S]*?```/g) || []
    let adjustment = 0
    for (const block of codeBlocks) {
      const normalEstimate = block.length * this.CHAR_TO_TOKEN_RATIO
      const codeEstimate = block.length * this.CODE_BLOCK_RATIO
      adjustment += codeEstimate - normalEstimate
    }
    return adjustment
  }

  private static calculateInlineCodeWeight(text: string): number {
    const withoutCodeBlocks = text.replace(/```[\s\S]*?```/g, '')
    const inlineCodes = withoutCodeBlocks.match(/`[^`]+`/g) || []
    let adjustment = 0
    for (const code of inlineCodes) {
      const normalEstimate = code.length * this.CHAR_TO_TOKEN_RATIO
      const codeEstimate = code.length * this.INLINE_CODE_RATIO
      adjustment += codeEstimate - normalEstimate
    }
    return adjustment
  }

  private static calculateUrlWeight(text: string): number {
    const urls = text.match(/https?:\/\/[^\s]+/g) || []
    let adjustment = 0
    for (const url of urls) {
      const normalEstimate = url.length * this.CHAR_TO_TOKEN_RATIO
      const urlEstimate = Math.max(this.URL_TOKENS, normalEstimate)
      adjustment += urlEstimate - normalEstimate
    }
    return adjustment
  }

  private static calculateHeaderWeight(text: string): number {
    const headers = text.match(/^#{1,6}\s+.+$/gm) || []
    return headers.length * 2
  }

  /**
   * 여러 텍스트의 총 토큰 수를 계산합니다.
   */
  static estimateTotal(texts: string[]): number {
    return texts.reduce((total, text) => total + this.estimate(text), 0)
  }

  /**
   * 텍스트가 주어진 토큰 한계를 초과하는지 확인합니다.
   */
  static exceedsLimit(text: string, maxTokens: number): boolean {
    return this.estimate(text) > maxTokens
  }
}
