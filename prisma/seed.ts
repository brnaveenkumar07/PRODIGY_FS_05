import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  console.log("Seeding database...");

  // Create demo users
  const passwordHash = await bcrypt.hash("password123", 12);

  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      name: "Alice Johnson",
      email: "alice@example.com",
      passwordHash,
      image: null,
      profile: {
        create: {
          bio: "Full-stack developer and coffee enthusiast.",
          website: "https://alice.dev",
          location: "San Francisco, CA",
        },
      },
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: {
      name: "Bob Smith",
      email: "bob@example.com",
      passwordHash,
      image: null,
      profile: {
        create: {
          bio: "Designer and open-source advocate.",
          website: "https://bobsmith.io",
          location: "New York, NY",
        },
      },
    },
  });

  const charlie = await prisma.user.upsert({
    where: { email: "charlie@example.com" },
    update: {},
    create: {
      name: "Charlie Brown",
      email: "charlie@example.com",
      passwordHash,
      image: null,
      profile: {
        create: {
          bio: "DevOps engineer and hiking lover.",
          location: "Austin, TX",
        },
      },
    },
  });

  // Create tags
  const tags = await Promise.all(
    ["nextjs", "typescript", "react", "prisma", "webdev", "oss", "design", "devops"].map((name) =>
      prisma.tag.upsert({ where: { name }, update: {}, create: { name } })
    )
  );

  const [tagNextjs, tagTs, tagReact, tagPrisma, tagWebdev] = tags;

  // Create posts
  const post1 = await prisma.post.create({
    data: {
      content:
        "Just shipped a new feature using Next.js App Router and Prisma. The developer experience is incredible! 🚀",
      authorId: alice.id,
      tags: {
        create: [
          { tag: { connect: { id: tagNextjs.id } } },
          { tag: { connect: { id: tagTs.id } } },
          { tag: { connect: { id: tagPrisma.id } } },
        ],
      },
    },
  });

  const post2 = await prisma.post.create({
    data: {
      content:
        "React 19 is a game changer. Server Components + Actions make so many patterns obsolete in the best way.",
      authorId: bob.id,
      tags: {
        create: [
          { tag: { connect: { id: tagReact.id } } },
          { tag: { connect: { id: tagWebdev.id } } },
        ],
      },
    },
  });

  const post3 = await prisma.post.create({
    data: {
      content:
        "Containerizing everything with Docker and deploying to Kubernetes. Loving the workflow.",
      authorId: charlie.id,
      tags: {
        create: [{ tag: { connect: { id: tags[7].id } } }],
      },
    },
  });

  const post4 = await prisma.post.create({
    data: {
      content:
        "TypeScript's type inference keeps surprising me. You can model almost anything if you think hard enough.",
      authorId: alice.id,
      tags: {
        create: [
          { tag: { connect: { id: tagTs.id } } },
          { tag: { connect: { id: tagWebdev.id } } },
        ],
      },
    },
  });

  // Add likes
  await prisma.like.createMany({
    data: [
      { userId: bob.id, postId: post1.id },
      { userId: charlie.id, postId: post1.id },
      { userId: alice.id, postId: post2.id },
      { userId: charlie.id, postId: post2.id },
      { userId: alice.id, postId: post3.id },
      { userId: bob.id, postId: post4.id },
    ],
    skipDuplicates: true,
  });

  // Add comments
  await prisma.comment.createMany({
    data: [
      {
        content: "Love this! Prisma + Next.js is my go-to stack too.",
        authorId: bob.id,
        postId: post1.id,
      },
      {
        content: "Agreed! The DX improvements are huge.",
        authorId: charlie.id,
        postId: post1.id,
      },
      {
        content: "Server Actions are so clean. No more boilerplate API routes!",
        authorId: alice.id,
        postId: post2.id,
      },
    ],
  });

  // Add follows
  await prisma.follow.createMany({
    data: [
      { followerId: bob.id, followingId: alice.id },
      { followerId: charlie.id, followingId: alice.id },
      { followerId: alice.id, followingId: bob.id },
    ],
    skipDuplicates: true,
  });

  console.log("Seed completed successfully!");
  console.log("Demo accounts (password: password123):");
  console.log(" - alice@example.com");
  console.log(" - bob@example.com");
  console.log(" - charlie@example.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
