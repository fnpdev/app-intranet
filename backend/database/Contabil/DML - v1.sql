
-- DROP TABLE public.accounting_invoices;

CREATE TABLE public.accounting_invoices (
	id serial4 NOT NULL,
	invoice_key varchar(44) NOT NULL,
	current_step varchar(30) DEFAULT 'GATE'::character varying NOT NULL,
	message varchar(100) NULL,
	note text NULL,
	user_id int4 NOT NULL,
	to_user_id int4 NULL,
	last_step_id int4 NULL,
	last_count_step_id int4 NULL,
	status varchar(20) DEFAULT 'OPEN'::character varying NULL,
	active bool DEFAULT true NULL,
	deleted_at timestamp NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	CONSTRAINT accounting_invoice_invoice_key_key UNIQUE (invoice_key),
	CONSTRAINT accounting_invoice_pkey PRIMARY KEY (id)
);


ALTER TABLE public.accounting_invoices ADD CONSTRAINT intranet_invoice_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.intranet_users(id) ON DELETE CASCADE;
ALTER TABLE public.accounting_invoices ADD CONSTRAINT intranet_invoice_to_user_id_fkey FOREIGN KEY (to_user_id) REFERENCES public.intranet_users(id) ON DELETE CASCADE;



CREATE TABLE public.accounting_invoice_steps (
	id serial4 NOT NULL,
	step varchar(30) NULL,
	from_step varchar(30) NULL,
	to_step varchar(30) NOT NULL,
	message varchar(100) NULL,
	note text NULL,
	invoice_id int4 NOT NULL,
	user_id int4 NOT NULL,
	to_user_id int4 NULL,
	deleted_at timestamp NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	CONSTRAINT accounting_invoice_steps_pkey PRIMARY KEY (id),
	CONSTRAINT accounting_invoice_steps_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.accounting_invoices(id) ON DELETE cascade,
	CONSTRAINT accounting_invoice_steps_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.intranet_users(id) ON DELETE cascade,
	CONSTRAINT accounting_invoice_steps_to_user_id_fkey FOREIGN KEY (to_user_id) REFERENCES public.intranet_users(id) ON DELETE CASCADE
);


CREATE TABLE public.accounting_invoice_counts (
	id serial4 NOT NULL,
	step_id int4 NOT NULL,
	user_id int4 NOT NULL,
	status varchar(20) DEFAULT 'OPEN'::character varying NULL,
	"matched" bool NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	deleted_at timestamp NULL,
	CONSTRAINT accounting_invoice_counts_pkey PRIMARY KEY (id),
	CONSTRAINT accounting_invoice_counts_step_id_pkey FOREIGN KEY (step_id) REFERENCES public.accounting_invoice_steps(id) ON DELETE CASCADE,
	CONSTRAINT accounting_invoice_counts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.intranet_users(id) ON DELETE cascade
);



CREATE TABLE public.accounting_invoice_count_items (
	id serial4 NOT NULL,
	count_id int4 NOT NULL,
	item_number int4 NOT NULL,
	description text NULL,
	ncm varchar(10) NULL,
	codigo varchar(15) NULL,
	unidade varchar(10) NULL,
	qty_nf numeric NULL,
	qty_counted numeric NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	deleted_at timestamp NULL,
	CONSTRAINT accounting_invoice_count_items_pkey PRIMARY KEY (id),
	CONSTRAINT accounting_invoice_count_items_count_id_fkey FOREIGN KEY (count_id) REFERENCES public.accounting_invoice_counts(id) ON DELETE cascade
);

