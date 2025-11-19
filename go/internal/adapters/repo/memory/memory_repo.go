package memory

import (
	"context"
	"errors"
	"fmt"
	"math/rand"
	"sync"
	"time"

	"example.com/todo/internal/domain"
)

type memRepo struct {
	mu   sync.RWMutex
	data map[string]domain.Todo
}

func New() *memRepo { return &memRepo{data: make(map[string]domain.Todo)} }

	func (m *memRepo) Create(ctx context.Context, title string) (domain.Todo, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	// Generate a shorter ID that's safe for JavaScript
	timestamp := time.Now().Unix()
	random := rand.Intn(10000)
	id := fmt.Sprintf("%d-%d", timestamp, random)
	now := time.Now()
	t := domain.Todo{ID: id, Title: title, Done: false, CreatedAt: now, UpdatedAt: now}
	m.data[id] = t
	return t, nil
}

func (m *memRepo) List(ctx context.Context) ([]domain.Todo, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	out := make([]domain.Todo, 0, len(m.data))
	for _, t := range m.data {
		out = append(out, t)
	}
	// simple bubble sort by CreatedAt for determinism
	for i := 0; i < len(out); i++ {
		for j := i + 1; j < len(out); j++ {
			if out[j].CreatedAt.Before(out[i].CreatedAt) {
				out[i], out[j] = out[j], out[i]
			}
		}
	}
	return out, nil
}

func (m *memRepo) Toggle(ctx context.Context, id string) (domain.Todo, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	t, ok := m.data[id]
	if !ok {
		return domain.Todo{}, errors.New("todo not found")
	}
	t.Done = !t.Done
	t.UpdatedAt = time.Now()
	m.data[id] = t
	return t, nil
}

func (m *memRepo) Delete(ctx context.Context, id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	if _, ok := m.data[id]; !ok {
		return errors.New("todo not found")
	}
	delete(m.data, id)
	return nil
}
