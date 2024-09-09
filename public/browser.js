window.onload = generateTodos; 
let skip = 0
function generateTodos(){
    axios.get(`/read-item?skip=${skip}`)
    .then((res)=>{
        if(res.data.status !== 200){
            alert(res.data.message);
            return;
        }
        console.log(res.data.data);
        const todos = res.data.data
        skip += todos.length; //after every fetch, the skip will be updated, and new fetch will have objects after previously fetched objects
        document.getElementById("item_list").insertAdjacentHTML(
            "beforeend",
            todos.map((item)=>{
                return `
                    <li class="list-group-item list-group-item-action d-flex align-items-center justify-content-between">
                        <span class="text-item">${item.todo}</span>
                        <div>
                            <button data-id="${item._id}" class="edit-me btn btn-secondary btn-sm mr-1">Edit</button>
                            <button data-id="${item._id}" class="delete-me btn btn-danger btn-sm">Delete</button>
                        </div>
                    </li>
                `;
            }).join("")
        )
    })
    .catch((err)=>{
        console.log(err)
    })
}

document.addEventListener("click", function (event){
    if(event.target.classList.contains("edit-me")){
        console.log("edit button clicked")
        const todoId = event.target.getAttribute("data-id")
        const newData = prompt("Enter new Todo Text")

        axios.post("/edit-item", {todoId, newData})
        .then((res)=>{
            if(res.data.status !== 200){
                alert(res.data.message);
                return;
            }
            event.target.parentElement.parentElement.querySelector(".text-item").innerHTML = newData;
        })
        .catch((error) => {
            console.log(error)
        })
    }
    // delete
    else if (event.target.classList.contains("delete-me")) {
        console.log("delete button clicked");
        //home work
        const todoId = event.target.getAttribute("data-id")
        axios.post("/delete-item", {todoId})
        .then((res)=>{
            if(res.data.status !== 200){
                alert(res.data.message);
                return;
            }
            event.target.parentElement.parentElement.remove()
        })
        .catch((err)=>console.log(err))
      }
    //  add new todo
    else if(event.target.classList.contains("add_item")){
        const todo = document.getElementById("create_field").value;
        axios
            .post("/create-item", {todo})
            .then((res)=>{
                console.log(res)
                if(res.data.status !== 201){
                    alert(res.data.message)
                    return;
                }
                document.getElementById("create_field").value = "";
                document.getElementById("item_list").insertAdjacentHTML(
                    "beforeend",
                    `<li class="list-group-item list-group-item-action d-flex align-items-center justify-content-between">
                        <span class="item-text"> ${res.data.data.todo}</span>
                        <div>
                            <button data-id="${res.data.data._id}" class="edit-me btn btn-secondary btn-sm mr-1">Edit</button>
                            <button data-id="${res.data.data._id}" class="delete-me btn btn-danger btn-sm">Delete</button>
                        </div>
                    </li>`
                );
            })
            .catch((err)=> console.log(err));
    }
    // show morw
    else if(event.target.classList.contains("show_more")){
        generateTodos();
    }
    
})

// generateTodos() // onother way. not needed as we are calling windows.onload