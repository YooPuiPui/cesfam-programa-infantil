--
-- PostgreSQL database dump
--

\restrict uKJWh9azsowVTGvt0B1O6TekeMawBY5aao9NYvyZL4blPFVsVeq4zUFHn3nOt39

-- Dumped from database version 15.18
-- Dumped by pg_dump version 15.18

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: Tutor; Type: TABLE DATA; Schema: public; Owner: root
--

SET SESSION AUTHORIZATION DEFAULT;

ALTER TABLE public."Tutor" DISABLE TRIGGER ALL;

COPY public."Tutor" (id_tutor, rut, nombre, apellido, telefono, parentesco, correo, direccion, sector, comuna) FROM stdin;
\.


ALTER TABLE public."Tutor" ENABLE TRIGGER ALL;

--
-- Data for Name: Paciente; Type: TABLE DATA; Schema: public; Owner: root
--

ALTER TABLE public."Paciente" DISABLE TRIGGER ALL;

COPY public."Paciente" (id_paciente, rut, nombre, apellido, nombre_social, fecha_nacimiento, sexo_biologico, identidad_genero, nacionalidad, direccion, sector, comuna, nhc, prevision, fecha_inscripcion, activo, es_sename, es_naneas_prematuro, es_poblacion_trans, es_migrante, creado_en, id_tutor_principal) FROM stdin;
\.


ALTER TABLE public."Paciente" ENABLE TRIGGER ALL;

--
-- Data for Name: Profesional; Type: TABLE DATA; Schema: public; Owner: root
--

ALTER TABLE public."Profesional" DISABLE TRIGGER ALL;

COPY public."Profesional" (id_profesional, rut, nombre, apellido, estamento, activo, creado_en) FROM stdin;
\.


ALTER TABLE public."Profesional" ENABLE TRIGGER ALL;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: root
--

ALTER TABLE public._prisma_migrations DISABLE TRIGGER ALL;

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
2283581f-8d23-4a44-aa51-8e48634bf27b	65fce5ac7d69d5557739ef1a78ed8772a84199ff990cde61780930a8e36a73bc	2026-06-03 20:54:01.545803+00	20260529214244_agregar_datos_administrativos_paciente	\N	\N	2026-06-03 20:54:01.457588+00	1
\.


ALTER TABLE public._prisma_migrations ENABLE TRIGGER ALL;

--
-- Name: Paciente_id_paciente_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public."Paciente_id_paciente_seq"', 1, false);


--
-- Name: Profesional_id_profesional_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public."Profesional_id_profesional_seq"', 1, false);


--
-- Name: Tutor_id_tutor_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public."Tutor_id_tutor_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

\unrestrict uKJWh9azsowVTGvt0B1O6TekeMawBY5aao9NYvyZL4blPFVsVeq4zUFHn3nOt39

