<p align="center">
   <img src="frontend/public/not_osu_logo_alt.svg" alt="Not~Osu!"/>
</p>

## SUMMARY

Not~Osu! is a web-based rhythm game which provides users with a fun and exciting gaming experience. The project was created as part of the 25T3 UNSW Devsoc Training Program.

## FEATURES

- [ ] 😊

## Technologies Used

- **Programming Languages**: Typescript
- **Frontend**: React.js, TailwindCSS
- **Backend**: Typescript, Express, MongoDB

## Installation

To run this project locally, follow these steps:

1. **Clone the Repository**
   ```bash
   git clone https://github.com/PPigeon98/not-osu.git
   cd not-osu
   ```
2. **Run the Frontend**
   ```bash
   cd frontend
   npm run dev
   ```
3. **Set up MongoDB (Optional for score syncing)**
   - Create a MongoDB database (MongoDB Atlas recommended for cloud hosting)
   - Create a `.env` file in the `api` directory with your MongoDB connection string:
     ```
     MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database-name
     ```
   - If `MONGODB_URI` is not set, the app will work without database features (localStorage only)

4. **Run the Backend (in a different terminal)**
   ```bash
   cd api
   npm install
   npm run dev
   ```