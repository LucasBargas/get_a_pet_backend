require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

const port = process.env.PORT || 5000;

app.use(express.json());

// Solve CORS
app.use(cors({ credentials: true, origin: '*' }));

// Static files
app.use(express.static('public'));

// Routes
const UserRoutes = require('./routes/UserRoutes');
const PetRoutes = require('./routes/PetRoutes');

app.use('/users', UserRoutes);
app.use('/pets', PetRoutes);

app.get('/', (req, res) => res.send('Get a Pet API'));

app.listen(port);
