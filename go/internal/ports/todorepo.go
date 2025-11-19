package ports

import (
	"context"
	"example.com/todo/internal/domain"
)

// TodoRepo is a driven port: the app depends on this interface; adapters implement it.
type TodoRepo interface {
	Create(ctx context.Context, title string) (domain.Todo, error)
	List(ctx context.Context) ([]domain.Todo, error)
	Toggle(ctx context.Context, id string) (domain.Todo, error)
	Delete(ctx context.Context, id string) error
}
