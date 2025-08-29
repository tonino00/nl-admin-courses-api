const mongoose = require('mongoose');

/**
 * Estabelece conexão com o banco de dados MongoDB
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Erro na conexão com MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
