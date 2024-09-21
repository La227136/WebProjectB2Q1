async function Connect(){
    const login = document.getElementById('LoginID').value;
    const password = document.getElementById('PasswordID').value;

    try{
        const Response = await fetch(`http://localhost:4000/login`, {
            method: 'POST',
            headers:{
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({login, password}) // body data type must match "Content-Type" header
        })

        if (!Response.ok){ //if response status code is not 200
            const errorMessage = await Response.text();
            throw new Error(errorMessage);
        }
        const result = await Response.json();
        // console.log(result.refreshToken);
        if(result.message){ //if response status code is 200
            localStorage.setItem('accessToken', result.accessToken); //store the accessToken and refreshToken in the local storage
            localStorage.setItem('refreshToken', result.refreshToken);
            localStorage.setItem('isConnected', true);
          //  console.log(result.refreshToken)
            window.location.href = "index.html"; //redirect to index.html
            // AddIcon.style.display = 'inline-block';
        }else if(result.error){
            alert(result.error || "Erreur lors de la connexion"); //display error message
        }
    }catch (error){
        alert("Mauvais login et/ou mot de passe")
        console.error('Erreur:', error.message || error);
    }
}