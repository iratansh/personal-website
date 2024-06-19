import "./aboutMe.css";

export default function Portfolio() {
  return (
    <>
      <div className="projects1">
        <p id="portfolio" className="projectsHeader">
          MY PORTFOLIO
        </p>

        <div className="container">
          <div className="box3">
            <p className="sinfoHeader">Stocker</p>
            <p className="sinfo">
              Stocker is a stock market trend predictor leveraging machine
              learning techniques such as XGBoost and Bayesian Neural Networks.
              The program is integrated with sentiment analysis and risk
              strategies, Stocker makes investing easy. Developed user-friendly
              interfaces in ReactJS and Swift for seamless access to dynamic
              stock market predictions.
            </p>

            <a
              href="https://github.com/iratansh/Python/tree/main/Stocker"
              target="blank"
              rel="noopener noreferrer"
            >
              <button className="repo">GITHUB REPO</button>
            </a>
          </div>

          <div className="box3">
            <p className="sinfoHeader">DocumentGPT:</p>
            <p className="sinfo">
              DocumentGPT is an AI-powered document analysis and summarization
              tool designed to assist users in efficiently extracting key
              insights from a wide range of documents, including reports,
              articles, research papers, and more. OpenAi's GPT 3.5 is used in
              the generation of a response.
            </p>
            <a
              href="https://github.com/iratansh/Python/tree/main/DocumentGPT"
              target="blank"
              rel="noopener noreferrer"
            >
              <button className="repo">GITHUB REPO</button>
            </a>
          </div>

          <div className="box3">
            <p className="sinfoHeader">Movie Database Web Application:</p>
            <p className="sinfo">
              This program is a React application that fetches movie data from
              The Movie Database (TMDb) API and displays it in a user interface.
              It allows users to search for movies, displays trending movies by
              default, and presents movie posters, titles, ratings, and
              overviews in a visually appealing layout. The program also
              includes CSS styling for layout, colors, and hover effects, and it
              has a test case to ensure the main component renders without
              errors.
            </p>
            <a
              href="https://github.com/iratansh/React/tree/main/Movie%20React"
              target="blank"
              rel="noopener noreferrer"
            >
              <button className="repo">GITHUB REPO</button>
            </a>
          </div>
        </div>
      </div>

      <div className="projects2">
        <div className="container2">
          <div className="box4">
            <p className="sinfoHeader">
              NLP+ML Project: Advanced Safety and Risk Management System for
              Asian Industry Web Application:
            </p>
            <p className="sinfo">
              Implemented K-Nearest Neighbors (KNN) machine learning algorithm
              for missing data imputation with a 94% accuracy. Conducted
              thorough analysis of safety reports, adeptly using diverse
              graphical representations to communicate correlations efficiently.
            </p>
            <a
              href="https://github.com/iratansh/Python/tree/main/UAIS%20Project"
              target="blank"
              rel="noopener noreferrer"
            >
              <button className="repo">GITHUB REPO</button>
            </a>
          </div>

          <div className="box4">
            <p className="sinfoHeader">
              HelpBot:
            </p>
            <p className="sinfo">
              Created a chatbot using spaCy
              for entity recognition and ChatterBot for conversation flow, achieving an 85% accuracy in
              understanding user intents and generating contextually relevant responses.
              Integrated APIs for real-time weather updates, stock and ETF information, and utilized BeautifulSoup for
              web scraping, ensuring accurate and timely data delivery. Enhanced data retrieval speed by 40% to
              optimize user experience.
            </p>
            <a
              href="https://github.com/iratansh/Python/tree/main/HelpBot"
              target="blank"
              rel="noopener noreferrer"
            >
              <button className="repo">GITHUB REPO</button>
            </a>
          </div>

          <div className="box4">
            <p className="sinfoHeader">WebEdit:</p>
            <p className="sinfo">
              Utilized React.js and Node.js to develop a dynamic document creation and editing full-stack web application, ensuring seamless integration and scalability for up to 10k concurrent users.
              Integrated an advanced word completion feature using over 466k words and Tries data structure.
              Added features for real-time suggestions and efficient editing capabilities.
            </p>
            <a
              href="https://github.com/iratansh/Python/tree/main/WebEdit%20FullStack%20App"
              target="blank"
              rel="noopener noreferrer"
            >
              <button className="repo">GITHUB REPO</button>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

