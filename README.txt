Delivery Partner Tracking

This archive contains two projects:

1) flutter_delivery_app - Flutter app that captures device location and sends via WebSocket to server.
2) nest-delivery-server - Node/NestJS server with a small raw `ws` server to accept connections at ws://<host>:3000/ws

Important notes:
- For Flutter emulator use ws://10.0.2.2:3000/ws or adjust to your host IP for real devices.
- Configure Android/iOS location permissions before running Flutter app.
- Run `npm install` in nest-delivery-server and `flutter pub get` in flutter_delivery_app.
