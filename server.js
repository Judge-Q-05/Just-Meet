const express = require('express');
const path = require('path');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

// === ВАШИ НАСТРОЙКИ TELEGRAM ===
const TG_BOT_TOKEN = 'СЮДА_ВСТАВЬ_ТОКЕН_БОТА'; 
const TG_CHAT_ID = 'СЮДА_ВСТАВЬ_СВОЙ_TELEGRAM_CHAT_ID'; 

app.use(express.json());
// Отдаем файлы из папки public
app.use(express.static(path.join(__dirname, 'public')));

// Обработчик формы
app.post('/api/submit', (req, res) => {
    const data = req.body;

    // Формируем красивый текст для Telegram
    let message = `🔔 *Новый ответ на приглашение!* \n\n`;
    message += `🎭 *Выбранная тема:* ${data.theme}\n`;
    message += `❤️ *Согласие:* ${data.agreed}\n`;
    
    if (data.interruptedAt) {
        message += `⚠️ *Прервано кнопкой "Не сегодня" на этапе:* ${data.interruptedAt}\n`;
    }
    
    message += `📅 *Дата:* ${data.date || 'Не выбрано'}\n`;
    message += `🕒 *Время:* ${data.time || 'Не выбрано'}\n`;
    message += `✍️ *Заметка к дате:* ${data.dateCustom || 'Нет'}\n`;
    message += `🍕 *Ресторан из списка:* ${data.restaurant || 'Не выбрано'}\n`;
    message += `📍 *Своё место / Адрес с карты:* ${data.placeCustom || 'Нет'}\n`;

    // Параметры для POST запроса в Telegram API
    const telegramUrl = `https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`;
    const payload = JSON.stringify({
        chat_id: TG_CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
    });

    const tgReq = https.request(telegramUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
        }
    }, (tgRes) => {
        let responseBody = '';
        tgRes.on('data', chunk => responseBody += chunk);
        tgRes.on('end', () => {
            if (tgRes.statusCode === 200) {
                res.status(200).json({ success: true });
            } else {
                console.error('Ошибка Telegram API:', responseBody);
                res.status(500).json({ success: false, error: 'Telegram error' });
            }
        });
    });

    tgReq.on('error', (err) => {
        console.error('Ошибка сетевого запроса к TG:', err);
        res.status(500).json({ success: false, error: 'Network error' });
    });

    tgReq.write(payload);
    tgReq.end();
});

app.listen(PORT, () => {
    console.log(`Сервер успешно запущен на порту ${PORT}`);
});