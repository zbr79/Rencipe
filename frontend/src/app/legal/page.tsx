import PublicInfoPage from "../components/PublicInfoPage";

export default function LegalPage() {
  return (
    <PublicInfoPage title="Legal">
      <section>
        <h2>Using Rencipe</h2>
        <p>Rencipe provides recipe discovery and meal planning features for general use. Information on the site may change over time and should be reviewed before relying on it.</p>
      </section>
      <section>
        <h2>Privacy</h2>
        <p>Please do not enter sensitive personal, financial, or confidential information. Use only information that you are comfortable storing in the service.</p>
      </section>
      <section>
        <h2>Recipe information</h2>
        <p>Recipes are provided for general use and inspiration, not as legal, medical, or dietary advice. Check ingredients, allergens, and preparation requirements before cooking.</p>
      </section>
    </PublicInfoPage>
  );
}
