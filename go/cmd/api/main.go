package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	app "example.com/todo/internal/app"
	repomem "example.com/todo/internal/adapters/repo/memory"
	httpadp "example.com/todo/internal/adapters/http"
)

func main() {
	log.SetFlags(log.LstdFlags | log.Lshortfile)

	// Adapters (driven): Infrastructure implementations
	repo := repomem.New()

	// Application core (use cases)
	svc := app.NewTodoService(repo)

	// Adapters (driver): HTTP server exposing the app via ports
	h := httpadp.NewServer(svc)

	srv := &http.Server{
		Addr:         ":8081",
		Handler:      h.Router(),
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	go func() {
		log.Println("listening on http://localhost:8081")
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("server error: %v", err)
		}
	}()

	<-ctx.Done()
	log.Println("shutting down...")
	shCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_ = srv.Shutdown(shCtx)
}
