package commands

import (
	"context"
	"fmt"

	"lesiw.io/command"
	"lesiw.io/command/sys"
)

func (Ops) Build() error {
	ctx := context.Background()
	sh := command.Shell(sys.Machine(), "bun")

	if err := sh.Exec(ctx, "bun", "install"); err != nil {
		return fmt.Errorf("bun install: %w", err)
	}

	if err := sh.Exec(ctx, "bun", "run", "build"); err != nil {
		return fmt.Errorf("bun run build: %w", err)
	}

	return nil
}
