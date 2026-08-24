CREATE TABLE "drug_class_indication" (
	"drug_class_id" integer NOT NULL,
	"indication_id" integer NOT NULL,
	CONSTRAINT "drug_class_indication_drug_class_id_indication_id_pk" PRIMARY KEY("drug_class_id","indication_id")
);
--> statement-breakpoint
ALTER TABLE "drug_class_indication" ADD CONSTRAINT "drug_class_indication_drug_class_id_drug_class_id_fk" FOREIGN KEY ("drug_class_id") REFERENCES "public"."drug_class"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drug_class_indication" ADD CONSTRAINT "drug_class_indication_indication_id_indication_id_fk" FOREIGN KEY ("indication_id") REFERENCES "public"."indication"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "drug_class_indication_indicationId_idx" ON "drug_class_indication" USING btree ("indication_id");