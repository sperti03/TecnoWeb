
$(document).ready(function() {
    


    window.onload = function() {
    const todoContainer = document.querySelector('.todocontainer');
    const emptyMessage = todoContainer.querySelector('.empty-message');

    const hasChildren = Array.from(todoContainer.children).some(child => !child.classList.contains('empty-message'));

    if (!hasChildren) {
        emptyMessage.style.display = 'flex';
    }
    }

    document.getElementById('searchInput').addEventListener('input', function() {
    document.getElementById('clearQuery').value = this.value;
    });

    $('#searchForm').on('submit', function(e) {
            e.preventDefault(); 
            var searchText = $('#searchInput').val();
            searchTodos(searchText);
            
        });

    $('#searchInput').on('input', function() {
            var searchText = $(this).val();
            searchTodos(searchText);
        });

    function searchTodos(searchText) {
        var url = '/search';
        $.ajax({
            url: url,
            type: 'GET',
            data: { query: searchText },
            success: function(data) {
                $('.todocontainer').empty();
                data.forEach(function(todo) {
                    var todoElement = `
                    <li class="todoslist ${todo.completed ? 'strikethrough' : ''}" data-todo-id="${todo._id}">
                            <div>
                                    <form id="deleteForm" action="/delete-todo" method="POST">
                                        <input type="hidden" name="todoId" value="${todo._id}">
                                        <button type="submit" id="trash"><i class="bi bi-trash3"></i></button>
                                    </form>
                                </div>
                                <div class="listelement"><span><strong><center>Todo:</center></strong></span>${todo.obj}</div>
                                <div class="listelement"><span><strong>Start Date:</strong></span> ${new Date(todo.startingDate).toLocaleDateString()}</div>
                                <div class="listelement"><span><strong>End Date:</strong></span> ${new Date(todo.endingDate).toLocaleDateString()}</div>
                                <div>
                                    <label class="checkbox-container">
                                        <input type="checkbox" class="toggleTodo" data-todo-id="${todo._id}" ${todo.completed ? 'checked' : ''}>
                                        <span class="custom-checkbox"></span>
                                    </label>
                                </div>
                        </li>`;
                    $('.todocontainer').append(todoElement);
                    var checkbox = $('.toggleTodo[data-todo-id="' + todo._id + '"]');
                    checkbox.prop('checked', todo.completed || false);
                });
            },
            error: function(error) {
                    console.error('Error fetching todos:', error);
                    }
        });
        
    } 

    $('.todocontainer').on('change', '.toggleTodo', function(e) {
    var todoId = $(this).data('todo-id');
    var todoList = $('.todoslist[data-todo-id="' + todoId + '"]');
    var checkbox = this;

    $.ajax({
        url: '/todoscompleted', 
        type: 'POST',
        data: JSON.stringify({
            id: todoId, 
            completed: checkbox.checked 
        }),
        contentType: 'application/json', 
        success: function(data) {
            console.log('Todo updated successfully');
        },
        error: function(error) {
            console.error('Error updating todo:', error);
        }
    });

    if (checkbox.checked) {
        todoList.addClass('strikethrough');
    } else {
        todoList.removeClass('strikethrough');
    }
});
        
});


