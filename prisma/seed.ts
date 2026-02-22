import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: "admin@devlog.com" },
    update: {},
    create: {
      name: "관리자",
      email: "admin@devlog.com",
      password: await hash("admin123", 12),
      role: "ADMIN",
      bio: "Devlog 관리자입니다.",
    },
  });

  // Create writer user
  const writer = await prisma.user.upsert({
    where: { email: "writer@devlog.com" },
    update: {},
    create: {
      name: "홍길동",
      email: "writer@devlog.com",
      password: await hash("writer123", 12),
      role: "WRITER",
      bio: "프론트엔드 개발자입니다.",
    },
  });

  // Create categories
  const categories = await Promise.all(
    [
      { name: "프론트엔드", slug: "frontend", description: "React, Vue, Angular 등 프론트엔드 기술" },
      { name: "백엔드", slug: "backend", description: "Node.js, Python, Go 등 백엔드 기술" },
      { name: "DevOps", slug: "devops", description: "CI/CD, Docker, Kubernetes 등" },
      { name: "알고리즘", slug: "algorithm", description: "알고리즘과 자료구조" },
    ].map((cat) =>
      prisma.category.upsert({
        where: { slug: cat.slug },
        update: {},
        create: cat,
      })
    )
  );

  // Create tags
  const tags = await Promise.all(
    [
      { name: "React", slug: "react" },
      { name: "TypeScript", slug: "typescript" },
      { name: "Next.js", slug: "nextjs" },
      { name: "Node.js", slug: "nodejs" },
      { name: "Docker", slug: "docker" },
      { name: "PostgreSQL", slug: "postgresql" },
      { name: "Tailwind CSS", slug: "tailwind-css" },
      { name: "Python", slug: "python" },
    ].map((tag) =>
      prisma.tag.upsert({
        where: { slug: tag.slug },
        update: {},
        create: tag,
      })
    )
  );

  // Create sample posts
  const posts = [
    {
      title: "Next.js 16에서 달라진 점들",
      slug: "nextjs-16-changes",
      content: `# Next.js 16에서 달라진 점들

Next.js 16이 출시되면서 많은 변화가 있었습니다. 이 글에서는 주요 변경사항을 살펴봅니다.

## 1. proxy.ts (구 middleware.ts)

기존의 \`middleware.ts\`가 \`proxy.ts\`로 이름이 변경되었습니다. Node.js 런타임에서 실행되어 더 많은 기능을 사용할 수 있게 되었습니다.

\`\`\`typescript
// proxy.ts
export function proxy(request: Request) {
  // Node.js runtime에서 실행
}
\`\`\`

## 2. React 19 기본 지원

React 19가 기본으로 포함되어 Server Components와 Server Actions를 더욱 편리하게 사용할 수 있습니다.

## 3. Turbopack 안정화

개발 서버에서 Turbopack이 기본으로 사용되어 빌드 속도가 크게 향상되었습니다.

> 자세한 내용은 공식 문서를 참고하세요.`,
      excerpt: "Next.js 16의 주요 변경사항을 알아봅니다. proxy.ts, React 19, Turbopack 등",
      categoryId: categories[0].id,
      authorId: admin.id,
      published: true,
      publishedAt: new Date("2026-02-20"),
      tagIds: [tags[2].id, tags[0].id, tags[1].id],
    },
    {
      title: "TypeScript 타입 시스템 완벽 가이드",
      slug: "typescript-type-system-guide",
      content: `# TypeScript 타입 시스템 완벽 가이드

TypeScript의 타입 시스템을 깊이 이해하면 더 안전하고 생산적인 코드를 작성할 수 있습니다.

## 제네릭 (Generics)

\`\`\`typescript
function identity<T>(arg: T): T {
  return arg;
}

const result = identity<string>("hello");
\`\`\`

## 조건부 타입 (Conditional Types)

\`\`\`typescript
type IsString<T> = T extends string ? true : false;

type A = IsString<string>; // true
type B = IsString<number>; // false
\`\`\`

## 유틸리티 타입

- \`Partial<T>\`: 모든 프로퍼티를 선택적으로
- \`Required<T>\`: 모든 프로퍼티를 필수로
- \`Pick<T, K>\`: 특정 프로퍼티만 선택
- \`Omit<T, K>\`: 특정 프로퍼티를 제외`,
      excerpt: "TypeScript 제네릭, 조건부 타입, 유틸리티 타입 등 타입 시스템 핵심 개념 정리",
      categoryId: categories[0].id,
      authorId: writer.id,
      published: true,
      publishedAt: new Date("2026-02-18"),
      tagIds: [tags[1].id],
    },
    {
      title: "Docker Compose로 개발 환경 구축하기",
      slug: "docker-compose-dev-setup",
      content: `# Docker Compose로 개발 환경 구축하기

Docker Compose를 활용하면 복잡한 개발 환경을 쉽게 구성할 수 있습니다.

## docker-compose.yml 작성

\`\`\`yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - .:/app
    depends_on:
      - db

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
\`\`\`

## 주요 명령어

| 명령어 | 설명 |
|--------|------|
| \`docker compose up\` | 서비스 시작 |
| \`docker compose down\` | 서비스 중지 |
| \`docker compose logs\` | 로그 확인 |
| \`docker compose exec\` | 컨테이너 내부 접속 |`,
      excerpt: "Docker Compose를 활용한 효율적인 로컬 개발 환경 구축 방법",
      categoryId: categories[2].id,
      authorId: admin.id,
      published: true,
      publishedAt: new Date("2026-02-15"),
      tagIds: [tags[4].id, tags[5].id],
    },
  ];

  for (const postData of posts) {
    const { tagIds, ...data } = postData;
    const post = await prisma.post.upsert({
      where: { slug: data.slug },
      update: {},
      create: {
        ...data,
        tags: {
          create: tagIds.map((tagId) => ({ tagId })),
        },
      },
    });
    console.log(`Created post: ${post.title}`);
  }

  console.log("Seed completed!");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
