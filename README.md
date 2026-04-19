# devlog

개발자들을 위한 글쓰기 플랫폼. Next.js 16 + Drizzle ORM + PostgreSQL + Auth.js.

## 개발 환경 설정

### 1. 요구사항

- Node.js 20+
- [pnpm](https://pnpm.io/)
- [Docker](https://docs.docker.com/get-docker/) (로컬 PostgreSQL 실행용)

### 2. 의존성 설치

```bash
pnpm install
```

### 3. 환경변수

```bash
cp .env.example .env
```

`.env`에서 최소한 아래 항목을 채워주세요:

- `AUTH_SECRET` — 아무 랜덤 문자열. 생성: `openssl rand -base64 32`
- OAuth 로그인 테스트가 필요하면 `AUTH_GITHUB_*`, `AUTH_GOOGLE_*`
- 이미지 업로드 테스트가 필요하면 `S3_*` (Supabase S3, AWS S3, MinIO 등)

`DATABASE_URL`은 기본값(docker-compose db)에 맞춰져 있어 그대로 두면 됩니다.

### 4. DB 실행 (Docker)

PostgreSQL만 컨테이너로 띄웁니다. 앱은 호스트에서 dev 모드로 돌립니다.

```bash
docker compose up -d db
```

### 5. 스키마 마이그레이션

```bash
pnpm db:migrate
```

### 6. 개발 서버 실행

```bash
pnpm dev
```

[http://localhost:3000](http://localhost:3000)에서 확인.

## 자주 쓰는 명령어

| 명령어 | 설명 |
|--------|------|
| `pnpm dev` | 개발 서버 |
| `pnpm build` | 프로덕션 빌드 |
| `pnpm start` | 프로덕션 서버 |
| `pnpm lint` | ESLint |
| `pnpm db:generate` | 스키마 변경 → 마이그레이션 파일 생성 |
| `pnpm db:migrate` | 마이그레이션 적용 |
| `pnpm db:push` | 스키마 직접 푸시 (개발용) |
| `pnpm db:studio` | Drizzle Studio (DB 뷰어) |
| `pnpm storybook` | 디자인 시스템 Storybook |

## 프로젝트 구조

```
app/              Next.js App Router
  (auth)/           로그인·회원가입
  (blog)/           공개 블로그 (피드, 글, 태그, 시리즈, 검색)
  (dashboard)/      작성자 대시보드
  api/              Route Handlers (feed, search, upload, auth 등)
components/
  ds/               stateinfra 디자인 시스템 wrapper
  post/ editor/ comment/ series/ ...  도메인 컴포넌트
lib/
  db/               Drizzle 스키마와 쿼리 헬퍼
  auth.ts           Auth.js 설정
actions/            서버 액션 (글/댓글/좋아요 등)
drizzle/            마이그레이션 SQL
```

## 트러블슈팅

- **DB 연결 오류**: `docker compose ps`로 `db` 컨테이너가 healthy인지 확인. 재시작은 `docker compose restart db`.
- **마이그레이션 에러**: 로컬 DB를 초기화하려면 `docker compose down -v` 후 다시 `up -d db` → `pnpm db:migrate`.
- **포트 충돌 (5432)**: 로컬에 이미 Postgres가 떠 있으면 해당 프로세스 종료 또는 `docker-compose.yml`의 포트 매핑 수정.
