import { relations } from "drizzle-orm";
import { index, integer, pgTable, primaryKey } from "drizzle-orm/pg-core";
import { drugClass } from "./drug-class.ts";
import { indication } from "./indication.ts";

export const drugClassIndication = pgTable(
  "drug_class_indication",
  {
    drugClassId: integer("drug_class_id")
      .notNull()
      .references(() => drugClass.id, { onDelete: "cascade" }),
    indicationId: integer("indication_id")
      .notNull()
      .references(() => indication.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({
      columns: [table.drugClassId, table.indicationId],
    }),
    index("drug_class_indication_indicationId_idx").on(table.indicationId),
  ],
);

export const drugClassIndicationRelations = relations(
  drugClassIndication,
  ({ one }) => ({
    drugClass: one(drugClass, {
      fields: [drugClassIndication.drugClassId],
      references: [drugClass.id],
    }),
    indication: one(indication, {
      fields: [drugClassIndication.indicationId],
      references: [indication.id],
    }),
  }),
);
