import Message from "./Message";

function HomePage() {
  return (
    <>
      <div className="saluto">
        <Message></Message>
      </div>
      <div className="cardContainer">
        <div className="card">
          <div className="card-body">calendario</div>
        </div>
        <div className="card">
          <div className="card-body">Note</div>
        </div>
        <div className="card">
          <div className="card-body">Pomodoro</div>
        </div>
      </div>
    </>
  );
}

export default HomePage;
