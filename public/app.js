let currentTheme = 'cats';
let collectedData = {
    theme: '',
    agreed: 'Да',
    date: '',
    time: '',
    dateCustom: '',
    restaurant: '',
    placeCustom: '',
    interruptedAt: '' // Для фиксации нажатий "Не сегодня"
};

let myMap;
let selectedCoordinates = null;
let selectedAddress = "";

// Инициализация карты Яндекс
ymaps.ready(function () {
    myMap = new ymaps.Map("yandex-map", {
        center: [55.755864, 37.617698], // Москва по умолчанию
        zoom: 11
    });

    // Слушаем клик по карте
    myMap.events.add('click', function (e) {
        const coords = e.get('coords');
        selectedCoordinates = coords;
        
        myMap.platemarks ? myMap.geoObjects.remove(myMap.platemarks) : null;
        
        // Создаем метку
        let placemark = new ymaps.Placemark(coords, {
            hintContent: 'Выбранное место'
        }, {
            preset: 'islands#redDotIcon'
        });
        
        myMap.platemarks = placemark;
        myMap.geoObjects.add(placemark);

        // Геокодируем координаты в адрес
        ymaps.geocode(coords).then(function (res) {
            let firstGeoObject = res.geoObjects.get(0);
            selectedAddress = firstGeoObject.getAddressLine();
        });
    });
});

// Выбор темы на 1 шаге
function selectTheme(themeKey) {
    currentTheme = themeKey;
    collectedData.theme = themeKey;
    
    const config = CONFIG[themeKey];
    
    // Применяем тему к body
    document.body.className = config.className;
    
    // Заполняем Шаг 2 (Приглашение)
    document.getElementById('dynamic-title').innerText = config.title;
    document.getElementById('dynamic-text').innerText = config.inviteText;
    document.getElementById('dynamic-img').src = config.mainImage;
    
    // Заполняем Шаг 3 (Радость)
    document.getElementById('joy-title').innerText = "Ураа! ✨";
    document.getElementById('joy-text').innerText = config.joyText;
    document.getElementById('joy-img').src = config.joyImage;

    // Заполняем Шаг 5 (Рестораны)
    const optionsDiv = document.getElementById('restaurant-options');
    optionsDiv.innerHTML = '';
    config.restaurants.forEach(rest => {
        let btn = document.createElement('button');
        btn.className = 'btn btn-secondary';
        btn.innerText = rest;
        btn.onclick = () => selectRestaurant(rest, btn);
        optionsDiv.appendChild(btn);
    });

    nextStep(2);
}

function nextStep(stepNumber) {
    // Скрываем все шаги
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    
    // Показываем нужный
    if(stepNumber === 2) document.getElementById('step-invite').classList.add('active');
    if(stepNumber === 3) document.getElementById('step-joy').classList.add('active');
    if(stepNumber === 4) document.getElementById('step-date').classList.add('active');
    if(stepNumber === 5) document.getElementById('step-place').classList.add('active');
    if(stepNumber === 6) document.getElementById('step-final').classList.add('active');
}

// Логика "Убегающей кнопки"
const runawayBtn = document.getElementById('runaway-btn');
if(runawayBtn) {
    const moveButton = () => {
        // Вычисляем случайные координаты внутри окна карточки
        const container = document.querySelector('.card-container');
        const pad = 20;
        const maxX = container.clientWidth - runawayBtn.clientWidth - pad;
        const maxY = container.clientHeight - runawayBtn.clientHeight - pad;
        
        const randomX = Math.floor(Math.random() * maxX);
        const randomY = Math.floor(Math.random() * maxY);
        
        runawayBtn.style.position = 'absolute';
        runawayBtn.style.left = randomX + 'px';
        runawayBtn.style.top = randomY + 'px';
    };

    runawayBtn.addEventListener('mouseover', moveButton);
    runawayBtn.addEventListener('touchstart', moveButton);
}

// Сохранение ресторана
function selectRestaurant(name, element) {
    collectedData.restaurant = name;
    // Визуальный фокус на выбранную кнопку
    document.querySelectorAll('#restaurant-options .btn').forEach(b => b.style.border = 'none');
    element.style.border = '3px solid var(--accent-color)';
}

// Сохранение шага даты
function saveDateAndNext() {
    collectedData.date = document.getElementById('input-date').value;
    collectedData.time = document.getElementById('input-time').value;
    collectedData.dateCustom = document.getElementById('date-custom').value;
    nextStep(5);
}

// Сохранение шага места
function savePlaceAndNext() {
    collectedData.placeCustom = document.getElementById('place-custom').value;
    nextStep(6);
}

// Обработка кнопки "Не сегодня"
function registerNotToday(stageName) {
    collectedData.agreed = 'Нажато "Не сегодня"';
    collectedData.interruptedAt = stageName;
    
    // Считываем то, что успели ввести на текущем шаге перед отменой
    collectedData.dateCustom = document.getElementById('date-custom').value;
    collectedData.placeCustom = document.getElementById('place-custom').value;
    
    // Сразу перенаправляем на финальный экран отправки отчета
    nextStep(6);
}

// Окна карты
function openMapModal() {
    document.getElementById('map-modal').style.display = 'flex';
    // Поправка размеров карты после открытия окна
    if (myMap) myMap.container.fitToViewport();
}
function closeMapModal() {
    document.getElementById('map-modal').style.display = 'none';
}
function confirmMapPlace() {
    if (selectedAddress) {
        document.getElementById('place-custom').value = selectedAddress;
    } else if (selectedCoordinates) {
        document.getElementById('place-custom').value = `Координаты: ${selectedCoordinates.join(', ')}`;
    }
    closeMapModal();
}

// Отправка данных бэкенду
function sendDataToServer() {
    const btn = document.getElementById('submit-form-btn');
    const status = document.getElementById('status-message');
    btn.disabled = true;
    status.innerText = "Отправка информации...";

    fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(collectedData)
    })
    .then(res => res.json())
    .then(data => {
        if(data.success) {
            status.style.color = "green";
            status.innerText = "Уведомление успешно доставлено! Жду нашей встречи 🤍";
        } else {
            status.style.color = "red";
            status.innerText = "Ошибка при отправке. Попробуй еще раз.";
            btn.disabled = false;
        }
    })
    .catch(err => {
        status.style.color = "red";
        status.innerText = "Ошибка соединения с сервером.";
        btn.disabled = false;
    });
}