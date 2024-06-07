const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const session = require('express-session');

const app = express();
const PORT = 3000;

// Crear la carpeta uploads si no existe
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Configuración de multer para subir archivos
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function(req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage: storage });

// Configuración de express-session
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // usar true si está utilizando HTTPS
}));

// Middleware para servir archivos estáticos
app.use(express.static('public'));  // Asegúrate de que esta línea está presente
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta para manejar la subida de archivos
app.post('/upload', upload.single('photo'), (req, res) => {
    const description = req.body.description;
    const filePath = req.file.path;

    // Guardar información del archivo y descripción
    const fileData = {
        path: '/' + filePath.replace(/\\/g, '/'), // Reemplazar las barras invertidas por barras normales
        description: description,
        uploadedAt: moment().format()
    };

    const dataFilePath = path.join(__dirname, 'uploads', 'data.json');
    let fileDataArray = [];

    if (fs.existsSync(dataFilePath)) {
        const rawData = fs.readFileSync(dataFilePath);
        fileDataArray = JSON.parse(rawData);
    }

    fileDataArray.push(fileData);
    fs.writeFileSync(dataFilePath, JSON.stringify(fileDataArray));

    res.redirect('/progress.html');
});

// Ruta para manejar la eliminación de archivos
app.post('/delete', (req, res) => {
    const filePath = req.body.path.replace(/^\//, '');

    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }

    const dataFilePath = path.join(__dirname, 'uploads', 'data.json');
    let fileDataArray = [];

    if (fs.existsSync(dataFilePath)) {
        const rawData = fs.readFileSync(dataFilePath);
        fileDataArray = JSON.parse(rawData);
    }

    fileDataArray = fileDataArray.filter(fileData => fileData.path !== '/' + filePath);
    fs.writeFileSync(dataFilePath, JSON.stringify(fileDataArray));

    res.redirect('/progress.html');
});

// Ruta para manejar el registro de usuarios
app.post('/register', (req, res) => {
    const { username, password } = req.body;

    const usersFilePath = path.join(__dirname, 'users.json');
    let usersArray = [];

    if (fs.existsSync(usersFilePath)) {
        const rawData = fs.readFileSync(usersFilePath);
        usersArray = JSON.parse(rawData);
    }

    const userExists = usersArray.some(user => user.username === username);

    if (userExists) {
        res.status(400).send('User already exists');
    } else {
        usersArray.push({ username, password });
        fs.writeFileSync(usersFilePath, JSON.stringify(usersArray));
        res.redirect('/login.html');
    }
});

// Ruta para manejar el inicio de sesión de usuarios
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    const usersFilePath = path.join(__dirname, 'users.json');
    let usersArray = [];

    if (fs.existsSync(usersFilePath)) {
        const rawData = fs.readFileSync(usersFilePath);
        usersArray = JSON.parse(rawData);
    }

    const user = usersArray.find(user => user.username === username && user.password === password);

    if (user) {
        req.session.user = user;
        res.redirect('/menu.html');
    } else {
        res.status(401).send('Invalid username or password');
    }
});

// Ruta para manejar el cierre de sesión
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login.html');
});

// Middleware para verificar si el usuario está autenticado
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login.html');
    }
}

// Servir la página de menú solo si el usuario está autenticado
app.get('/menu.html', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'menu.html'));
});

// Ruta para generar dietas
app.get('/generate-diet', (req, res) => {
    const calories = parseInt(req.query.calories, 10);

    let meals = [];

    if (calories <= 2000) {
        meals = [
            {
                name: "Desayuno",
                option1: "2 huevos revueltos con espinacas y 1 rebanada de pan integral",
                option2: "1 taza de avena con plátano y nueces"
            },
            {
                name: "Colación",
                option1: "1 manzana",
                option2: "1 yogurt griego"
            },
            {
                name: "Comida",
                option1: "150g de pollo a la parrilla con verduras",
                option2: "Ensalada de atún con espinacas y tomate"
            },
            {
                name: "Colación",
                option1: "1 puñado de almendras",
                option2: "1 rebanada de pan integral con aguacate"
            },
            {
                name: "Cena",
                option1: "Sopa de verduras con quinoa",
                option2: "Omelette de 3 claras de huevo con champiñones"
            }
        ];
    } else if (calories <= 2500) {
        meals = [
            {
                name: "Desayuno",
                option1: "3 huevos revueltos con espinacas y 2 rebanadas de pan integral",
                option2: "1 taza de avena con plátano, nueces y miel"
            },
            {
                name: "Colación",
                option1: "1 manzana y 1 puñado de nueces",
                option2: "1 yogurt griego con granola"
            },
            {
                name: "Comida",
                option1: "200g de pollo a la parrilla con verduras",
                option2: "Ensalada de atún con espinacas, tomate y aguacate"
            },
            {
                name: "Colación",
                option1: "1 puñado de almendras y 1 yogurt",
                option2: "2 rebanadas de pan integral con aguacate"
            },
            {
                name: "Cena",
                option1: "Sopa de verduras con quinoa y 1 filete de pescado",
                option2: "Omelette de 4 claras de huevo con champiñones y espinacas"
            }
        ];
    } else {
        meals = [
            {
                name: "Desayuno",
                option1: "4 huevos revueltos con espinacas y 2 rebanadas de pan integral",
                option2: "1 taza de avena con plátano, nueces, miel y fresas"
            },
            {
                name: "Colación",
                option1: "1 plátano y 1 puñado de nueces",
                option2: "1 yogurt griego con granola y frutas"
            },
            {
                name: "Comida",
                option1: "250g de pollo a la parrilla con verduras",
                option2: "Ensalada de atún con espinacas, tomate, aguacate y huevo"
            },
            {
                name: "Colación",
                option1: "1 puñado de almendras y 1 yogurt griego",
                option2: "2 rebanadas de pan integral con aguacate y tomate"
            },
            {
                name: "Cena",
                option1: "Sopa de verduras con quinoa y 1 filete de salmón",
                option2: "Omelette de 5 claras de huevo con champiñones, espinacas y pimientos"
            }
        ];
    }

    res.json(meals);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
