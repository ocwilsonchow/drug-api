import { relations } from "drizzle-orm";
import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { drugClass } from "./drug-class.ts";

export const drug = pgTable(
  "drug",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    drugClassId: integer("drug_class_id")
      .notNull()
      .references(() => drugClass.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("drug_drugClassId_idx").on(table.drugClassId)],
);

export const drugRelations = relations(drug, ({ one }) => ({
  drugClass: one(drugClass, {
    fields: [drug.drugClassId],
    references: [drugClass.id],
  }),
}));
