-- Enable Row Level Security (RLS) for ALL tables (existing and new).

CREATE TABLE public.transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description text NOT NULL,
  amount numeric NOT NULL,
  date date NOT NULL,
  type text NOT NULL,
  category text NOT NULL,
  unit text NOT NULL,
  bank text,
  observations text,
  card_id uuid,
  created timestamp with time zone DEFAULT now(),
  updated timestamp with time zone DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access their own transactions" ON public.transactions FOR ALL USING (auth.uid() = user_id);

CREATE TABLE public.establishment_mappings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  suggested_category text,
  last_triage_type text,
  created timestamp with time zone DEFAULT now(),
  updated timestamp with time zone DEFAULT now()
);
ALTER TABLE public.establishment_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access their own establishment mappings" ON public.establishment_mappings FOR ALL USING (auth.uid() = user_id);

CREATE TABLE public.details (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  created timestamp with time zone DEFAULT now(),
  updated timestamp with time zone DEFAULT now()
);
ALTER TABLE public.details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access their own details" ON public.details FOR ALL USING (auth.uid() = user_id);

CREATE TABLE public.import_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  status text NOT NULL,
  raw_data jsonb,
  triage_state jsonb,
  last_position integer,
  created timestamp with time zone DEFAULT now(),
  updated timestamp with time zone DEFAULT now()
);
ALTER TABLE public.import_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access their own import sessions" ON public.import_sessions FOR ALL USING (auth.uid() = user_id);

CREATE TABLE public.credit_cards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL,
  holder text NOT NULL,
  limit numeric NOT NULL,
  created timestamp with time zone DEFAULT now(),
  updated timestamp with time zone DEFAULT now()
);
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access their own credit cards" ON public.credit_cards FOR ALL USING (auth.uid() = user_id);

-- ADD FOREIGN KEY FOR CARD_ID AFTER CREDIT_CARDS IS CREATED
ALTER TABLE public.transactions ADD CONSTRAINT transactions_card_id_fkey FOREIGN KEY (card_id) REFERENCES public.credit_cards(id) ON DELETE SET NULL;

-- NEW TABLES

CREATE TABLE public.contas_pagar (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  descricao text NOT NULL,
  valor numeric NOT NULL,
  vencimento date NOT NULL,
  status text NOT NULL,
  unidade text NOT NULL,
  categoria text NOT NULL,
  recorrente boolean NOT NULL DEFAULT false,
  created timestamp with time zone DEFAULT now(),
  updated timestamp with time zone DEFAULT now()
);
ALTER TABLE public.contas_pagar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access their own contas pagar" ON public.contas_pagar FOR ALL USING (auth.uid() = user_id);

CREATE TABLE public.corretores (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  nivel text NOT NULL,
  email text,
  cpf text,
  ativo boolean NOT NULL DEFAULT true,
  created timestamp with time zone DEFAULT now(),
  updated timestamp with time zone DEFAULT now()
);
ALTER TABLE public.corretores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access their own corretores" ON public.corretores FOR ALL USING (auth.uid() = user_id);

CREATE TABLE public.comissoes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES public.transactions(id) ON DELETE CASCADE,
  corretor_id uuid REFERENCES public.corretores(id) ON DELETE SET NULL,
  tipo_papel text NOT NULL,
  percentual numeric NOT NULL,
  valor numeric NOT NULL,
  status_pagamento text NOT NULL,
  created timestamp with time zone DEFAULT now(),
  updated timestamp with time zone DEFAULT now()
);
ALTER TABLE public.comissoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access their own comissoes" ON public.comissoes FOR ALL USING (auth.uid() = user_id);

CREATE TABLE public.contratos_locacao (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  imovel text NOT NULL,
  locatario text NOT NULL,
  valor numeric NOT NULL,
  vencimento_dia integer NOT NULL,
  indice_reajuste text,
  proximo_reajuste date,
  ativo boolean NOT NULL DEFAULT true,
  created timestamp with time zone DEFAULT now(),
  updated timestamp with time zone DEFAULT now()
);
ALTER TABLE public.contratos_locacao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access their own contratos_locacao" ON public.contratos_locacao FOR ALL USING (auth.uid() = user_id);
