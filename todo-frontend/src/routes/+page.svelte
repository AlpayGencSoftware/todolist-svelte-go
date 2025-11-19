<script lang="ts">
	import { onMount } from 'svelte';
	import { Plus, Check, Trash2, Loader } from 'lucide-svelte';
	import { todoApiService, type Todo } from '$lib/api/index.js';
	import { isLoading, globalError } from '$lib/interceptors.js';

	let todos: Todo[] = [];
	let newTodoTitle = '';
	let error = '';

	async function fetchTodos() {
		try {
			todos = await todoApiService.getTodos();
			error = '';
		} catch (err) {
			error = err instanceof Error ? err.message : 'Bir hata oluştu';
		}
	}

	async function addTodo() {
		if (!newTodoTitle.trim()) return;
		
		try {
			const newTodo = await todoApiService.createTodo({ title: newTodoTitle.trim() });
			todos = [...todos, newTodo];
			newTodoTitle = '';
			error = '';
		} catch (err) {
			error = err instanceof Error ? err.message : 'Bir hata oluştu';
		}
	}

	async function toggleTodo(id: string) {
		try {
			const updatedTodo = await todoApiService.toggleTodo(id);
			todos = todos.map(todo => 
				todo.id === id ? updatedTodo : todo
			);
			error = '';
		} catch (err) {
			error = err instanceof Error ? err.message : 'Bir hata oluştu';
		}
	}

	async function deleteTodo(id: string) {
		try {
			await todoApiService.deleteTodo(id);
			todos = todos.filter(todo => todo.id !== id);
			error = '';
		} catch (err) {
			error = err instanceof Error ? err.message : 'Bir hata oluştu';
		}
	}

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			addTodo();
		}
	}

	onMount(() => {
		fetchTodos();
	});
</script>

<svelte:head>
	<title>Todo Uygulaması</title>
</svelte:head>

<main class="container">
	<header class="header">
		<h1>📝 Todo Uygulaması</h1>
		<p>Görevlerinizi organize edin ve takip edin</p>
	</header>

	{#if error || $globalError}
		<div class="error">
			{error || $globalError}
		</div>
	{/if}

	<div class="add-todo">
		<div class="input-group">
			<input
				type="text"
				bind:value={newTodoTitle}
				on:keypress={handleKeyPress}
				placeholder="Yeni görev ekleyin..."
				disabled={$isLoading}
				class="todo-input"
			/>
			<button 
				on:click={addTodo} 
				disabled={$isLoading || !newTodoTitle.trim()}
				class="add-button"
			>
				{#if $isLoading}
					<Loader class="icon spin" />
				{:else}
					<Plus class="icon" />
				{/if}
				Ekle
			</button>
		</div>
	</div>

	<div class="todos-container">
		{#if $isLoading && todos.length === 0}
			<div class="loading">
				<Loader class="icon spin" />
				<p>Görevler yükleniyor...</p>
			</div>
		{:else if todos.length === 0}
			<div class="empty-state">
				<p>Henüz görev yok. İlk görevinizi ekleyin!</p>
			</div>
		{:else}
			<div class="todos-list">
				{#each todos as todo (todo.id)}
					<div class="todo-item" class:completed={todo.done}>
						<button 
							on:click={() => toggleTodo(todo.id)}
							class="toggle-button"
							disabled={$isLoading}
						>
							{#if todo.done}
								<Check class="icon check-icon" />
							{/if}
						</button>
						
						<div class="todo-content">
							<h3 class="todo-title">{todo.title}</h3>
							<p class="todo-date">
								Oluşturuldu: {new Date(todo.createdAt).toLocaleString('tr-TR')}
							</p>
						</div>
						
						<button 
							on:click={() => deleteTodo(todo.id)}
							class="delete-button"
							disabled={$isLoading}
						>
							<Trash2 class="icon" />
						</button>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	{#if todos.length > 0}
		<div class="stats">
			<p>
				Toplam: {todos.length} görev | 
				Tamamlanan: {todos.filter(t => t.done).length} | 
				Kalan: {todos.filter(t => !t.done).length}
			</p>
		</div>
	{/if}
</main>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		min-height: 100vh;
	}

	.container {
		max-width: 50rem;
		margin: 0 auto;
		padding: 2rem 1rem;
		min-height: 100vh;
	}

	.header {
		text-align: center;
		margin-bottom: 3rem;
		color: white;
	}

	.header h1 {
		font-size: 3rem;
		margin: 0 0 0.5rem 0;
		font-weight: 700;
		text-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.3);
	}

	.header p {
		font-size: 1.125rem;
		margin: 0;
		opacity: 0.9;
	}

	.error {
		background: #fee;
		color: #c33;
		padding: 1rem;
		border-radius: 0.5rem;
		margin-bottom: 1.5rem;
		border: 0.0625rem solid #fcc;
	}

	.add-todo {
		background: white;
		padding: 1.5rem;
		border-radius: 1rem;
		box-shadow: 0 0.25rem 1rem rgba(0, 0, 0, 0.1);
		margin-bottom: 2rem;
	}

	.input-group {
		display: flex;
		gap: 0.75rem;
	}

	.todo-input {
		flex: 1;
		padding: 0.875rem 1rem;
		border: 0.125rem solid #e1e5e9;
		border-radius: 0.5rem;
		font-size: 1rem;
		transition: border-color 0.2s;
	}

	.todo-input:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 0.1875rem rgba(102, 126, 234, 0.1);
	}

	.add-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.875rem 1.5rem;
		background: #667eea;
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.add-button:hover:not(:disabled) {
		background: #5a6fd8;
	}

	.add-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.todos-container {
		background: white;
		border-radius: 1rem;
		box-shadow: 0 0.25rem 1rem rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	.loading, .empty-state {
		text-align: center;
		padding: 3rem;
		color: #6b7280;
	}

	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.todos-list {
		display: flex;
		flex-direction: column;
	}

	.todo-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.25rem 1.5rem;
		border-bottom: 0.0625rem solid #f3f4f6;
		transition: background-color 0.2s;
	}

	.todo-item:last-child {
		border-bottom: none;
	}

	.todo-item:hover {
		background: #f9fafb;
	}

	.todo-item.completed {
		opacity: 0.7;
	}

	.todo-item.completed .todo-title {
		text-decoration: line-through;
		color: #6b7280;
	}

	.toggle-button {
		width: 1.5rem;
		height: 1.5rem;
		border: 0.125rem solid #d1d5db;
		border-radius: 50%;
		background: white;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
		flex-shrink: 0;
	}

	.toggle-button:hover:not(:disabled) {
		border-color: #667eea;
	}

	.completed .toggle-button {
		background: #10b981;
		border-color: #10b981;
	}

	.todo-content {
		flex: 1;
		min-width: 0;
	}

	.todo-title {
		margin: 0 0 0.25rem 0;
		font-size: 1.125rem;
		font-weight: 500;
		color: #1f2937;
		word-wrap: break-word;
	}

	.todo-date {
		margin: 0;
		font-size: 0.875rem;
		color: #6b7280;
	}

	.delete-button {
		width: 2rem;
		height: 2rem;
		border: none;
		background: #fee;
		color: #dc2626;
		border-radius: 0.375rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background-color 0.2s;
		flex-shrink: 0;
	}

	.delete-button:hover:not(:disabled) {
		background: #fecaca;
	}

	.stats {
		text-align: center;
		margin-top: 2rem;
		color: white;
		font-size: 0.875rem;
		opacity: 0.9;
	}

	.icon {
		width: 1.25rem;
		height: 1.25rem;
	}

	.check-icon {
		color: white;
	}

	.spin {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	@media (max-width: 48rem) {
		.container {
			padding: 1rem 0.75rem;
		}

		.header h1 {
			font-size: 2rem;
		}

		.input-group {
			flex-direction: column;
		}

		.todo-item {
			padding: 1rem;
		}

		.todo-title {
			font-size: 1rem;
		}
	}
</style>
