
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import * as fs from 'fs';
import * as firebaseAdmin from 'firebase-admin';
import { join } from 'path';
import * as dns from 'dns';
import * as cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

import * as bodyParser from 'body-parser';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';

dns.setDefaultResultOrder('ipv4first');

function loadFirebaseServiceAccount(): firebaseAdmin.ServiceAccount | null {
  const firebaseAdminJson = process.env.FIREBASE_ADMINSDK_JSON;
  if (firebaseAdminJson) {
    return JSON.parse(firebaseAdminJson) as firebaseAdmin.ServiceAccount;
  }

  const firebaseAdminBase64 = process.env.FIREBASE_ADMINSDK_BASE64;
  if (firebaseAdminBase64) {
    return JSON.parse(
      Buffer.from(firebaseAdminBase64, 'base64').toString('utf-8'),
    ) as firebaseAdmin.ServiceAccount;
  }

  const firebaseKeyFilePath = join(
    process.cwd(),
    'src',
    'config',
    'firebase-adminsdk.json',
  );

  if (!fs.existsSync(firebaseKeyFilePath)) {
    console.warn('Firebase key file not found:', firebaseKeyFilePath);
    return null;
  }

  return JSON.parse(fs.readFileSync(firebaseKeyFilePath, 'utf-8')) as firebaseAdmin.ServiceAccount;
}

async function bootstrap() {

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable Helmet security headers
  app.use(helmet());

  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ extended: true }));


  app.use((req, res, next) => {
    console.log(`\n📝 [REQUEST] ${req.method} ${req.url}`);
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      console.log(`🔑 JWT Token: Present`);
    } else {
      console.log(`🔑 JWT Token: None`);
    }
    if (req.body && Object.keys(req.body).length > 0) {
      console.log(`📦 Body: Present (${Object.keys(req.body).length} fields)`);
    }
    next();
  });


  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.use(cookieParser.default());


  if (firebaseAdmin.apps.length === 0) {
    const firebaseServiceAccount = loadFirebaseServiceAccount();
    if (firebaseServiceAccount) {
      console.log('Initializing Firebase Admin SDK...');
      firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert(firebaseServiceAccount),
      });
    } else {
      console.warn('Firebase Admin SDK was not initialized. Firebase admin features will fail until credentials are configured.');
    }
  }

  const corsOrigin = process.env.CORS_ORIGIN || '*';
  const corsOrigins = corsOrigin === '*'
    ? '*'
    : corsOrigin.split(',').map(o => o.trim());

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'PATCH', 'DELETE', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'clientId', 'platform', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    credentials: corsOrigin !== '*',
    maxAge: 86400,
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
