import PublicInfoPage from "../components/PublicInfoPage";

export default function AboutPage() {
  return (
    <PublicInfoPage title="About">
      <section>
        <h2>Make cooking easier</h2>
        <p>Rencipe is a recipe discovery and meal planning tool designed to make cooking decisions easier.</p>
      </section>
      <section>
        <h2>Explore and organize</h2>
        <p>Browse dishes, save recipes you want to revisit, and organize meal ideas in one focused workspace.</p>
        <ul>
          <li>Discover recipes by cuisine, category, and preference.</li>
          <li>Save recipes for quick access later.</li>
          <li>Build meal ideas when you are ready to plan.</li>
        </ul>
      </section>
    </PublicInfoPage>
  );
}
