CREATE TABLE "expense_idempotency" (
	"user_id" text NOT NULL,
	"group_id" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"expense_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "expense_idempotency_user_id_group_id_idempotency_key_pk" PRIMARY KEY("user_id","group_id","idempotency_key")
);
--> statement-breakpoint
ALTER TABLE "expense_idempotency" ADD CONSTRAINT "expense_idempotency_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_idempotency" ADD CONSTRAINT "expense_idempotency_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_idempotency" ADD CONSTRAINT "expense_idempotency_expense_id_expenses_id_fk" FOREIGN KEY ("expense_id") REFERENCES "public"."expenses"("id") ON DELETE no action ON UPDATE no action;