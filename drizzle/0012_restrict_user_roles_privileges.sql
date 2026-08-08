REVOKE ALL PRIVILEGES ON TABLE "public"."user_roles" FROM PUBLIC, "anon", "authenticated";
GRANT SELECT ON TABLE "public"."user_roles" TO "authenticated";
