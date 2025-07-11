# Image Viewer

Helpful image viewer for local analysis purposes

## How to use it

### Prerequisites

- Ensure you have Mongo running locally
- Ensure that you have S3 credentials sufficient to use boto3 to access images

### Server

1. Create a virtual environment for the project and install dependencies. From the project root:

```
$ python -m venv venv
$ pip install -r requirements.txt
```

2. Run the server:

```
$ python app.py
```

### Client

The only gotcha: you gotta run this from the frontend subdirectlry

```
$ cd frontend
$ npm install
$ npm start
```

Now you can visit http://localhost:3000 and life is good.
