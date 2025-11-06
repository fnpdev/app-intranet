CREATE TABLE public.intranet_users (
	id serial4 NOT NULL,
	username varchar(100) NOT NULL,
	"name" varchar(200) NOT NULL,
	email varchar(200) NULL,
	user_level int4 DEFAULT 1 NOT NULL,
	is_active bool DEFAULT true NULL,
	ad_account bool DEFAULT false NULL,
	last_login timestamp NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	deleted_at timestamp NULL,
	CONSTRAINT intranet_users_pkey PRIMARY KEY (id),
	CONSTRAINT intranet_users_username_key UNIQUE (username)
);
INSERT INTO public.intranet_users
(id, username, "name", email, user_level, is_active, ad_account)
VALUES(nextval('intranet_users_id_seq'::regclass), 'geovane.prestes', 'Geovane Prestes', 'geovane.prestes@novapiratininga.com', 1, true, false);


CREATE TABLE public.intranet_variables (
	id serial4 NOT NULL,
	"key" varchar NOT NULL,
	description varchar(200) NOT NULL,
	"order" int4 DEFAULT 0 NULL,
	is_active bool DEFAULT true NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	CONSTRAINT intranet_variables_pkey PRIMARY KEY (id),
	CONSTRAINT intranet_variables_key_key UNIQUE (key)
);

INSERT INTO public.intranet_variables
(id, "key", description, "order", is_active, created_at, updated_at)
VALUES(nextval('intranet_variables_id_seq'::regclass), 'admin', 'Admini', 0, true, now(), now());




CREATE TABLE public.intranet_variable_options (
	id serial4 NOT NULL,
	variable_id int4 NULL,
	description text NULL,
	value varchar(100) NOT NULL,
	is_default bool DEFAULT false NULL,
	is_active bool DEFAULT true NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	CONSTRAINT intranet_variable_options_pkey PRIMARY KEY (id),
	CONSTRAINT intranet_variable_options_unique_variable_value UNIQUE (variable_id, value)
);
CREATE INDEX idx_intranet_variable_options_variable_id ON public.intranet_variable_options USING btree (variable_id);


-- public.intranet_variable_options chaves estrangeiras

ALTER TABLE public.intranet_variable_options ADD CONSTRAINT fk_variable_options_variable_id FOREIGN KEY (variable_id) REFERENCES public.intranet_variables(id) ON DELETE CASCADE;



CREATE TABLE public.intranet_user_variables (
	id serial4 NOT NULL,
	user_id int4 NULL,
	variable_id int4 NULL,
	value varchar(100) NOT NULL,
	updated_at timestamp DEFAULT now() NULL,
	CONSTRAINT intranet_user_variables_pkey PRIMARY KEY (id),
	CONSTRAINT intranet_user_variables_user_variable_unique UNIQUE (user_id, variable_id)
);
CREATE INDEX idx_user_variables_variable_id ON public.intranet_user_variables USING btree (variable_id);


-- public.intranet_user_variables chaves estrangeiras

ALTER TABLE public.intranet_user_variables ADD CONSTRAINT fk_user_variables_variable_id FOREIGN KEY (variable_id) REFERENCES public.intranet_variables(id) ON DELETE CASCADE;
ALTER TABLE public.intranet_user_variables ADD CONSTRAINT intranet_user_variables_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.intranet_users(id) ON DELETE CASCADE;


CREATE TABLE public.intranet_modules (
	id serial4 NOT NULL,
	"key" varchar NOT NULL,
	"name" text NOT NULL,
	description text NULL,
	icon text NULL,
	category text NULL,
	route_path text NULL,
	order_index int4 DEFAULT 0 NULL,
	is_active bool DEFAULT true NULL,
	is_public bool DEFAULT false NULL,
	is_visible bool DEFAULT true NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	deleted_at timestamp NULL,
	CONSTRAINT intranet_modules_pkey PRIMARY KEY (id)
);
INSERT INTO public.intranet_modules
(id, "key", "name", description, icon, category, route_path, order_index, is_active, is_public, is_visible, created_at, updated_at)
VALUES(nextval('intranet_modules_id_seq'::regclass), 'admin', 'Admin', 'Admin', '', '', '/admin', 0, true, false, true, now(), now());



CREATE TABLE public.intranet_user_permissions (
	id serial4 NOT NULL,
	user_id int4 NOT NULL,
	module_id int4 NOT NULL,
	is_active bool DEFAULT true NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	deleted_at timestamp NULL,
	CONSTRAINT intranet_user_permissions_pkey PRIMARY KEY (id),
	CONSTRAINT intranet_user_permissions_unique UNIQUE (user_id, module_id)
);


-- public.intranet_user_permissions chaves estrangeiras

ALTER TABLE public.intranet_user_permissions ADD CONSTRAINT intranet_user_permissions_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.intranet_modules(id) ON DELETE CASCADE;
ALTER TABLE public.intranet_user_permissions ADD CONSTRAINT intranet_user_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.intranet_users(id) ON DELETE CASCADE;



CREATE TABLE public.intranet_queries (
	id serial4 NOT NULL,
	"key" text NOT NULL,
	description text NULL,
	db text NOT NULL,
	query text NOT NULL,
	is_active bool DEFAULT true NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	CONSTRAINT intranet_queries_key_key UNIQUE (key),
	CONSTRAINT intranet_queries_pkey PRIMARY KEY (id)
);

-- public.intranet_pages definição

-- Drop table

-- DROP TABLE public.intranet_pages;

CREATE TABLE public.intranet_pages (
	id serial4 NOT NULL,
	module_id int4 NULL,
	"key" varchar NULL,
	"name" text NOT NULL,
	description text DEFAULT '"desc"'::text NULL,
	"path" text DEFAULT '/'::text NOT NULL,
	path_ignore text DEFAULT ''::text NULL,
	is_active bool DEFAULT true NULL,
	is_public bool DEFAULT false NULL,
	layout text DEFAULT 'default'::text NULL,
	component text NULL,
	with_layout bool DEFAULT true NULL,
	order_index int4 DEFAULT 0 NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	CONSTRAINT intranet_pages_pkey PRIMARY KEY (id)
);


-- public.intranet_pages chaves estrangeiras

ALTER TABLE public.intranet_pages ADD CONSTRAINT intranet_pages_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.intranet_modules(id) ON DELETE CASCADE;


-- public.intranet_page_queries definição

-- Drop table

-- DROP TABLE public.intranet_page_queries;

CREATE TABLE public.intranet_page_queries (
	id serial4 NOT NULL,
	page_id int4 NULL,
	query_id int4 NULL,
	order_index int4 DEFAULT 0 NULL,
	is_active bool DEFAULT true NULL,
	is_main bool DEFAULT false NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	CONSTRAINT intranet_page_queries_pkey PRIMARY KEY (id)
);


-- public.intranet_page_queries chaves estrangeiras

ALTER TABLE public.intranet_page_queries ADD CONSTRAINT intranet_page_queries_page_id_fkey FOREIGN KEY (page_id) REFERENCES public.intranet_pages(id) ON DELETE CASCADE;
ALTER TABLE public.intranet_page_queries ADD CONSTRAINT intranet_page_queries_query_id_fkey FOREIGN KEY (query_id) REFERENCES public.intranet_queries(id) ON DELETE CASCADE;











