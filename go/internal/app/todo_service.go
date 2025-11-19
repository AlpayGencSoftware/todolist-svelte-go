package app

import (
	"context"
	"errors"
	"strings"

	"example.com/todo/internal/domain"
	"example.com/todo/internal/ports"
)

// TodoService holds business use-cases. It depends on ports, not implementations.
type TodoService struct {
	repo ports.TodoRepo
}

func NewTodoService(repo ports.TodoRepo) *TodoService { return &TodoService{repo: repo} }

func (s *TodoService) Create(ctx context.Context, title string) (domain.Todo, error) {
	title = strings.TrimSpace(title)
	if title == "" {
		return domain.Todo{}, errors.New("title is required")
	}
	return s.repo.Create(ctx, title)
}

func (s *TodoService) List(ctx context.Context) ([]domain.Todo, error) {
	return s.repo.List(ctx)
}

func (s *TodoService) Toggle(ctx context.Context, id string) (domain.Todo, error) {
	return s.repo.Toggle(ctx, id)
}

func (s *TodoService) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}
