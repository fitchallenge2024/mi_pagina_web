document.addEventListener('DOMContentLoaded', function() {
    const generateDietButton = document.getElementById('generate-diet-button');
    if (generateDietButton) {
        generateDietButton.addEventListener('click', generateDiet);
    }
});

function generateDiet() {
    const calories = document.getElementById('calories-input').value;

    if (calories) {
        fetch(`/generate-diet?calories=${calories}`)
            .then(response => response.json())
            .then(meals => {
                const dietResult = document.getElementById('diet-result');
                dietResult.innerHTML = '';

                meals.forEach(meal => {
                    const mealDiv = document.createElement('div');
                    mealDiv.classList.add('meal');

                    const mealName = document.createElement('h3');
                    mealName.textContent = meal.name;
                    mealDiv.appendChild(mealName);

                    const option1 = document.createElement('p');
                    option1.textContent = `Opción 1: ${meal.option1}`;
                    mealDiv.appendChild(option1);

                    const option2 = document.createElement('p');
                    option2.textContent = `Opción 2: ${meal.option2}`;
                    mealDiv.appendChild(option2);

                    dietResult.appendChild(mealDiv);
                });
            });
    } else {
        alert('Por favor, introduce tu carga calórica diaria.');
    }
}
