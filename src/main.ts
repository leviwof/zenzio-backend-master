
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import * as fs from 'fs';
import * as firebaseAdmin from 'firebase-admin';
import { join } from 'path';
import * as dns from 'dns';
import * as cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';


import * as bodyParser from 'body-parser';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';

dns.setDefaultResultOrder('ipv4first');

async function bootstrap() {

  const app = await NestFactory.create<NestExpressApplication>(AppModule);


  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ extended: true }));


  app.use((req, res, next) => {
    console.log(`\n📝 [REQUEST] ${req.method} ${req.url}`);
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const jwtToken = authHeader.substring(7);
      console.log(`🔑 JWT Token: ${jwtToken}`);
    } else {
      console.log(`🔑 JWT Token: No Token`);
    }
    if (req.body && Object.keys(req.body).length > 0) {
      console.log(`📦 Body: ${JSON.stringify(req.body, null, 2)}`);
    }
    next();
  });


  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  app.use(cookieParser.default());


  const firebaseKeyFilePath = join(
    process.cwd(),
    'src',
    'config',
    'firebase-adminsdk.json',
  );

  if (!fs.existsSync(firebaseKeyFilePath)) {
    console.error('Firebase key file not found:', firebaseKeyFilePath);
    process.exit(1);
  }

  const firebaseServiceAccount = JSON.parse(
    fs.readFileSync(firebaseKeyFilePath, 'utf-8'),
  ) as firebaseAdmin.ServiceAccount;

  if (firebaseAdmin.apps.length === 0) {
    console.log('Initializing Firebase Admin SDK...');
    firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert(firebaseServiceAccount),
    });
  }

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'clientId'],
    credentials: true,
  });

  app.useGlobalFilters(new HttpExceptionFilter());


  const config = new DocumentBuilder()
    .setTitle('Zenzio API')
    .setDescription('API documentation for Zenzio')
    .setVersion('1.0')


.addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token',
        in: 'header',
      },
      'bearer', // <-- Matches the default @ApiBearerAuth() decorators perfectly
    )
    .addSecurityRequirements('bearer') // <-- Applies it globally to every endpoint
    .addCookieAuth('token', {
      type: 'apiKey',
      in: 'cookie',
      description: 'JWT token stored in cookie named "token"',
    })


    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: 'clientId',
        description: 'Client ID required in headers',
      },
      'client-id',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: { persistAuthorization: true, withCredentials: true },
  });


  app.use((req, res, next) => {
    if (!req.headers['clientid']) {
      req.headers['clientid'] = '4197a0e1-6e3f-4452-8381-d391f60f8154';
    }
    next();
  });





  const port = Number(process.env.PORT) || 4000;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Server running on http://0.0.0.0:${port}`);
  console.log(`📘 Swagger docs: http://localhost:${port}/api-docs`);
  console.log(`☁️  All file uploads use AWS S3 bucket storage`);
}

bootstrap().catch((err) => {
  console.error('Application failed to start', err);
  process.exit(1);
});
