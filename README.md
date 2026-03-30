# TossPayments Agent Skill

토스페이먼츠 결제 연동 가이드 문서 검색 Agent Skill.

`@tosspayments/integration-guide-mcp`의 Agent Skill 버전입니다.

## 설치

```
npx skills add mainsoft-2024/toss-payments-agent-skills
```

## 구조

- `skills/tosspayments-docs/` — 배포되는 스킬 (SKILL.md + scripts/ + references/)
- `packages/cli/` — CLI 빌드 인프라 (TypeScript 소스)

## 개발

```bash
cd packages/cli
pnpm install
pnpm run build    # → skills/tosspayments-docs/scripts/cli.js
pnpm test
pnpm run type-check
```
