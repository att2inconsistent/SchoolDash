import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// Nilai status memakai string persis seperti yang dibandingkan frontend,
// jadi tidak perlu lapisan pemetaan di sisi UI.
export const categoryEnum = pgEnum('category', ['berat', 'minuman', 'cemilan', 'sehat']);

// PRD §F butuh 3 tahap; frontend lama hanya punya 2.
export const orderStatusEnum = pgEnum('order_status', [
  'Menunggu',
  'Sedang Dibuat',
  'Selesai',
]);

export const ownerTypeEnum = pgEnum('owner_type', ['student', 'seller']);

export const transactionKindEnum = pgEnum('transaction_kind', [
  'topup',
  'order',
  'earning',
  'withdrawal',
]);

export const transactionStatusEnum = pgEnum('transaction_status', [
  'Menunggu',
  'Berhasil',
  'Gagal',
]);

// students & sellers dipisah: endpoint login juga dipisah
// (/api/auth/* vs /api/seller/auth/*).
export const students = pgTable(
  'students',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    kelas: text('kelas').notNull().default('-'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('students_email_uq').on(t.email)]
);

export const sellers = pgTable(
  'sellers',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    storeName: text('store_name').notNull(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('sellers_email_uq').on(t.email)]
);

// Kantin. `owner` di frontend berupa string email — di sini sudah dinormalisasi
// jadi sellerId, dan response API memetakan balik ke `owner: seller.email`.
// Nullable karena seed punya kantin yang belum punya akun seller.
export const vendors = pgTable(
  'vendors',
  {
    id: serial('id').primaryKey(),
    sellerId: integer('seller_id').references(() => sellers.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    tags: text('tags').array().notNull().default(sql`'{}'::text[]`),
    rating: real('rating').notNull().default(0),
    time: text('time').notNull().default('10-15 Menit'),
    image: text('image'),
  },
  (t) => [uniqueIndex('vendors_seller_uq').on(t.sellerId)]
);

export const categories = pgTable('categories', {
  key: text('key').primaryKey(),
  label: text('label').notNull(),
});

// id = serial PK: seed frontend pakai string "1-1" dan runtime pakai
// `${vendorId}-${Date.now()}`, dua-duanya tidak bisa jadi PK numerik.
// Frontend hanya membandingkan id lewat equality, jadi integer aman.
export const menuItems = pgTable(
  'menu_items',
  {
    id: serial('id').primaryKey(),
    vendorId: integer('vendor_id')
      .notNull()
      .references(() => vendors.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description').notNull().default(''),
    price: integer('price').notNull(),
    category: categoryEnum('category').notNull().default('berat'),
    image: text('image'),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('menu_items_vendor_idx').on(t.vendorId),
    index('menu_items_category_idx').on(t.category),
  ]
);

export const orders = pgTable(
  'orders',
  {
    id: text('id').primaryKey(), // "ORD-XXXXX", dibuat di service
    studentId: integer('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    // snapshot: frontend menampilkan nama & kelas pembeli apa adanya
    studentName: text('student_name').notNull(),
    studentKelas: text('student_kelas').notNull().default('-'),
    vendorId: integer('vendor_id')
      .notNull()
      .references(() => vendors.id, { onDelete: 'cascade' }),
    status: orderStatusEnum('status').notNull().default('Menunggu'),
    totalItems: integer('total_items').notNull().default(0),
    total: integer('total').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('orders_student_idx').on(t.studentId),
    index('orders_vendor_idx').on(t.vendorId),
    index('orders_created_at_idx').on(t.createdAt),
  ]
);

// name & price sengaja diduplikasi sebagai snapshot supaya riwayat pesanan
// tidak berubah ketika seller mengubah harga menu.
export const orderItems = pgTable(
  'order_items',
  {
    id: serial('id').primaryKey(),
    orderId: text('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    menuItemId: integer('menu_item_id').references(() => menuItems.id, {
      onDelete: 'set null',
    }),
    name: text('name').notNull(),
    price: integer('price').notNull(),
    qty: integer('qty').notNull().default(1),
  },
  (t) => [index('order_items_order_idx').on(t.orderId)]
);

// owner_id sengaja bukan FK: satu tabel wallets dipakai siswa & penjual,
// jadi rujukan ditentukan oleh owner_type.
export const wallets = pgTable(
  'wallets',
  {
    id: serial('id').primaryKey(),
    ownerType: ownerTypeEnum('owner_type').notNull(),
    ownerId: integer('owner_id').notNull(),
    balance: integer('balance').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('wallets_owner_uq').on(t.ownerType, t.ownerId),
    index('wallets_owner_idx').on(t.ownerType, t.ownerId),
  ]
);

// Satu tabel untuk 4 arus duit: topup siswa, potong saat order, kredit
// pendapatan seller, dan penarikan seller. amount > 0 = masuk, < 0 = keluar.
export const transactions = pgTable(
  'transactions',
  {
    id: text('id').primaryKey(), // "TRX-" / "EAR-" / "WDR-" + timestamp
    walletId: integer('wallet_id')
      .notNull()
      .references(() => wallets.id, { onDelete: 'cascade' }),
    orderId: text('order_id').references(() => orders.id, { onDelete: 'set null' }),
    amount: integer('amount').notNull(),
    kind: transactionKindEnum('kind').notNull(),
    status: transactionStatusEnum('status').notNull().default('Menunggu'),
    note: text('note').notNull().default(''),
    // hanya terisi untuk topup (QRIS berlaku 15 menit)
    qrisPayload: text('qris_payload'),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    // hanya terisi untuk withdrawal
    bank: text('bank'),
    accountName: text('account_name'),
    accountNumber: text('account_number'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('transactions_wallet_idx').on(t.walletId),
    index('transactions_created_at_idx').on(t.createdAt),
  ]
);

export const studentsRelations = relations(students, ({ many }) => ({
  orders: many(orders),
}));

export const sellersRelations = relations(sellers, ({ one, many }) => ({
  vendor: one(vendors),
  orders: many(orders),
}));

export const vendorsRelations = relations(vendors, ({ one, many }) => ({
  seller: one(sellers, {
    fields: [vendors.sellerId],
    references: [sellers.id],
  }),
  menuItems: many(menuItems),
  orders: many(orders),
}));

export const menuItemsRelations = relations(menuItems, ({ one, many }) => ({
  vendor: one(vendors, {
    fields: [menuItems.vendorId],
    references: [vendors.id],
  }),
  orderItems: many(orderItems),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  student: one(students, {
    fields: [orders.studentId],
    references: [students.id],
  }),
  vendor: one(vendors, {
    fields: [orders.vendorId],
    references: [vendors.id],
  }),
  items: many(orderItems),
  transactions: many(transactions),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  menuItem: one(menuItems, {
    fields: [orderItems.menuItemId],
    references: [menuItems.id],
  }),
}));

export const walletsRelations = relations(wallets, ({ many }) => ({
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  wallet: one(wallets, {
    fields: [transactions.walletId],
    references: [wallets.id],
  }),
  order: one(orders, {
    fields: [transactions.orderId],
    references: [orders.id],
  }),
}));
