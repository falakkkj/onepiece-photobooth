# One Piece Wanted Poster Web App

This project is a web application that allows users to create a One Piece-style "Wanted Poster" by adding their photos and stickers to a customizable poster template.

## Project Structure

```
one-piece-wanted-poster
├── src
│   ├── index.html        # HTML structure for the app
│   ├── styles.css        # CSS for styling the poster
│   ├── app.js            # Main entry point for the application
│   ├── poster.js         # Fabric.js initialization and layer setup
│   └── stickers.js       # Logic for adding and managing stickers
├── package.json          # npm configuration file
├── .gitignore            # Files and directories to ignore in Git
└── README.md             # Project documentation
```

## Features

- Fixed-size poster container (320x480)
- User photo placement within the poster cutout
- Draggable and scalable stickers that are clipped within the poster area
- Layered design with proper z-index management

## Setup Instructions

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```
   cd one-piece-wanted-poster
   ```

3. Install the required dependencies:
   ```
   npm install
   ```

4. Open `src/index.html` in your web browser to view the application.

## Usage

- Upload a user photo to be placed on the poster.
- Add stickers by selecting them from the available options.
- Drag and scale stickers as needed, ensuring they remain within the poster boundaries.
- Save or share your completed Wanted Poster.

## Development

- The application uses Fabric.js for canvas manipulation.
- The main logic for the application is divided into separate JavaScript files for better organization and maintainability.

## Contributing

Contributions are welcome! Please submit a pull request or open an issue for any suggestions or improvements.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.