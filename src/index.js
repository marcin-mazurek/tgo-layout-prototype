import React from "react";
import ReactDOM from "react-dom";

const SECTION_TYPE_RECENTLY_PLAYED = "SECTION_TYPE_RECENTLY_PLAYED";
const SECTION_TYPE_GAMES = "SECTION_TYPE_GAMES";
const SECTION_TYPE_BANNER = "SECTION_TYPE_BANNER";
const SECTION_TYPE_JACKPOT = "SECTION_TYPE_JACKPOT";
const SECTION_TYPE_APPS = "SECTION_TYPE_APPS";
const LAYOUT_TYPE_LARGE = "LAYOUT_TYPE_LARGE";
const LAYOUT_TYPE_MEDIUM = "LAYOUT_TYPE_MEDIUM";
const LAYOUT_TYPE_SMALL = "LAYOUT_TYPE_SMALL";

const createGetSectionByType = sections => type =>
  sections.find(section => section.type === type);

const createGetSectionsByType = sections => type =>
  sections.filter(section => section.type === type);

const flattenArray = list =>
  list.reduce((a, b) => a.concat(Array.isArray(b) ? flattenArray(b) : b), []);

// Metacomponent - doesn't render anything on its own, only for markup transportation
const Section = ({ children }) => children;

const SectionGroupWrapper = ({ children }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-around",
      flexWrap: "wrap",
      maxWidth: "850px",
      margin: "auto"
    }}
  >
    {children}
  </div>
);

const SectionGroup = ({ children }) => (
  <SectionGroupWrapper>
    {flattenArray(React.Children.toArray(children)).map((child, index) => {
      if (child.type !== Section) {
        throw new Error("SectionGroup can only consist of Section components");
      }

      if (!child.props || typeof child.props.children !== "function") {
        throw new Error("Render function must be supplied as Section child");
      }

      const renderSectionContent = child.props.children;
      const position = index + 1;

      return renderSectionContent(position);
    })}
  </SectionGroupWrapper>
);

const SectionPlaceholder = ({ label, styles, position, notes }) => (
  <div
    style={{
      minWidth: "30%",
      flex: 1,
      height: "100px",
      color: "tomato",
      border: "1px solid tomato",
      display: "flex",
      flexShrink: "0",
      alignItems: "center",
      justifyContent: "center",
      ...styles
    }}
  >
    {`<${label} position={${position}} />`} {notes}
  </div>
);

const RecentlyPlayedSection = props => (
  <SectionPlaceholder
    label="RecentlyPlayedSection"
    notes="(Try hiding me by manipulating props!)"
    {...props}
  />
);

const GamesSection = props => (
  <SectionPlaceholder label="GamesSection" {...props} />
);

const BannerSection = props => (
  <SectionPlaceholder
    label="BannersSection"
    styles={{ minWidth: "100%" }}
    {...props}
  />
);

const JackpotSection = props => (
  <SectionPlaceholder
    label="JackpotSection"
    styles={{ minWidth: "100%", height: "400px" }}
    {...props}
  />
);

const AppsSection = props => (
  <SectionPlaceholder
    label="AppsSection"
    styles={{ minWidth: "100%" }}
    {...props}
  />
);

const renderGamesSections = sections =>
  sections.map(gamesSection => (
    <Section>
      {position => <GamesSection data={gamesSection} position={position} />}
    </Section>
  ));

const TopGamesTabContent = ({ sections, layoutType }) => {
  const getSectionByType = createGetSectionByType(sections);
  const getSectionsByType = createGetSectionsByType(sections);

  const recentlyPlayedSection = getSectionByType(SECTION_TYPE_RECENTLY_PLAYED);
  const gamesSections = getSectionsByType(SECTION_TYPE_GAMES);
  const bannerSection = getSectionByType(SECTION_TYPE_BANNER);
  const jackpotSections = getSectionsByType(SECTION_TYPE_JACKPOT);
  const appsSection = getSectionByType(SECTION_TYPE_APPS);

  const sectionsAboveBannerCountMap = {
    [LAYOUT_TYPE_LARGE]: 2,
    [LAYOUT_TYPE_MEDIUM]: 1,
    [LAYOUT_TYPE_SMALL]: 0
  };

  if (sectionsAboveBannerCountMap[layoutType] === undefined) {
    throw new Error("Incorrect layout type specified: " + layoutType);
  }

  let numberOfGamesSectionAboveBanner = sectionsAboveBannerCountMap[layoutType];

  if (recentlyPlayedSection && !recentlyPlayedSection.hidden) {
    numberOfGamesSectionAboveBanner--;
  }

  return (
    <SectionGroup>
      {recentlyPlayedSection &&
        !recentlyPlayedSection.hidden && (
          <Section>
            {position => (
              <RecentlyPlayedSection
                data={recentlyPlayedSection}
                position={position}
              />
            )}
          </Section>
        )}
      {renderGamesSections(
        gamesSections.slice(0, numberOfGamesSectionAboveBanner + 1)
      )}
      {bannerSection && (
        <Section>
          {position => (
            <BannerSection data={bannerSection} position={position} />
          )}
        </Section>
      )}
      {jackpotSections.map(jackpotSection => (
        <Section>
          {position => (
            <JackpotSection data={jackpotSection} position={position} />
          )}
        </Section>
      ))}
      {renderGamesSections(
        gamesSections.slice(numberOfGamesSectionAboveBanner + 1)
      )}
      {appsSection && (
        <Section>
          {position => <AppsSection data={appsSection} position={position} />}
        </Section>
      )}
    </SectionGroup>
  );
};

function throttleWithRAF(fn) {
  let animationFrame;

  return function throttler(...args) {
    if (animationFrame) cancelAnimationFrame(animationFrame);

    animationFrame = requestAnimationFrame(() => {
      fn.apply(args);
    });
  };
}

const getLayoutType = () => {
  if (window.matchMedia("(min-width: 800px)").matches) {
    return LAYOUT_TYPE_LARGE;
  } else if (window.matchMedia("(min-width: 600px)").matches) {
    return LAYOUT_TYPE_MEDIUM;
  }
  return LAYOUT_TYPE_SMALL;
};

class LayoutTypeController extends React.Component {
  state = { layoutType: null };

  componentDidMount() {
    this.determineLayoutType();

    this.resizeListener = window.addEventListener(
      "resize",
      throttleWithRAF(this.determineLayoutType)
    );
  }

  determineLayoutType = () => {
    const layoutType = getLayoutType();

    // to avoid unnecessary re-rendering
    if (layoutType !== this.state.layoutType) {
      this.setState({ layoutType });
    }
  };

  componentWillUnmount() {
    window.removeEventListener(this.resizeListener);
  }

  render() {
    if (!this.state.layoutType) return <span />;
    return this.props.children(this.state.layoutType);
  }
}

const TopGamesOverlay = () => {
  // Feel free to play around with me!
  const sections = [
    { type: SECTION_TYPE_RECENTLY_PLAYED, hidden: false },
    { type: SECTION_TYPE_GAMES, hidden: false },
    { type: SECTION_TYPE_GAMES, hidden: false },
    { type: SECTION_TYPE_GAMES, hidden: false },
    { type: SECTION_TYPE_GAMES, hidden: false },
    { type: SECTION_TYPE_GAMES, hidden: false },
    { type: SECTION_TYPE_BANNER, hidden: false },
    { type: SECTION_TYPE_JACKPOT, hidden: false },
    { type: SECTION_TYPE_JACKPOT, hidden: false },
    { type: SECTION_TYPE_APPS, hidden: false }
  ];

  return (
    <LayoutTypeController>
      {layoutType => (
        <TopGamesTabContent layoutType={layoutType} sections={sections} />
      )}
    </LayoutTypeController>
  );
};

ReactDOM.render(<TopGamesOverlay />, document.getElementById("root"));
