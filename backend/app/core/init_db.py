from sqlalchemy import text

from app.core.database import Base, engine
from app.models import tables  # noqa: F401


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    with engine.begin() as connection:
        connection.execute(
            text(
                """
                CREATE OR REPLACE FUNCTION enforce_audit_log_immutable()
                RETURNS trigger AS $$
                BEGIN
                    RAISE EXCEPTION 'audit_log is immutable and cannot be updated or deleted';
                END;
                $$ LANGUAGE plpgsql;
                """
            )
        )
        connection.execute(
            text(
                """
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_trigger WHERE tgname = 'audit_log_immutable_trigger'
                    ) THEN
                        CREATE TRIGGER audit_log_immutable_trigger
                        BEFORE UPDATE OR DELETE ON audit_log
                        FOR EACH ROW EXECUTE FUNCTION enforce_audit_log_immutable();
                    END IF;
                END;
                $$;
                """
            )
        )


if __name__ == "__main__":
    init_db()
    print("Database schema initialized")
