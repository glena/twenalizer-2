Twinalizer-2
============

Migración de la primera version de twenalizer (twenalizer-ukraine.germanlena.com.ar) a meteor con nuevas funcionalidades e histórico de tweets.

Detalles
--------

* Visualización de tweets en real time sobre diversas temáticas
* Migrado a Meteor para facilitar la interacción en real time
* Almacena en Mongo los tweets recibidos para almacenar el histórico

Proximos pasos
--------------

* Visualización del histórico a medida pasa el tiempo
* Manejo de multiples streams de tweets (posiblemente implementado sobre una única conexión a twitter, posiblemente limitados)
* Votación de temas para definir cuales son los que se van a monitorear
* Posibilidad de sugerir temas

Configuración
-------------

Crear el archivo environment.js (ver ejemplo: environment.js.demo) con el siguiente formato:

Create an app here https://dev.twitter.com/apps and copy your keys as following

```
twitter_conf = {
    consumer: {
        key: "YOUR CONSUMER KEY",
        secret: "YOUR CONSUMER SECRET"
    },
    access_token: {
        key: "YOUR APP KET",
        secret: "YOUR APP SECRET"
    }
}
```

[![Analytics](https://ga-beacon.appspot.com/UA-51467836-1/glena/twinalizer-2)](http://germanlena.com.ar)
