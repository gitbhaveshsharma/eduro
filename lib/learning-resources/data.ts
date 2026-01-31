/**
 * Learning Resources Data
 * Educational content for students of classes 5-10
 * Content is written in simple, easy-to-understand language
 */

export interface LearningResource {
    id: string;
    slug: string;
    title: string;
    subtitle: string;
    subject: {
        id: string;
        name: string;
        icon: string;
        color: string;
    };
    emoji: string;
    materialCount: number;
    estimatedReadTime: number; // in minutes
    difficulty: 'easy' | 'medium' | 'hard';
    gradeLevel: string; // e.g., "5-7" or "8-10"
    sections: LearningSection[];
    summary: string;
    keyTakeaways: string[];
    relatedResources: string[]; // IDs of related resources
    createdAt: string;
    updatedAt: string;
}

export interface LearningSection {
    id: string;
    title: string;
    content: string;
    type: 'text' | 'tip' | 'example' | 'activity' | 'fun-fact';
}

// Subject definitions matching the SUBJECT_CONFIG in subject-assets.ts
const SUBJECTS = {
    physics: { id: 'physics', name: 'Physics', icon: '⚛️', color: 'bg-purple-100 text-purple-600' },
    geography: { id: 'geography', name: 'Geography', icon: '🌍', color: 'bg-teal-100 text-teal-600' },
    chemistry: { id: 'chemistry', name: 'Chemistry', icon: '🧪', color: 'bg-emerald-100 text-emerald-600' },
    business: { id: 'business_studies', name: 'Business Studies', icon: '💼', color: 'bg-rose-100 text-rose-600' },
    mathematics: { id: 'mathematics', name: 'Mathematics', icon: '📐', color: 'bg-orange-100 text-orange-600' },
    english: { id: 'english', name: 'English', icon: '📚', color: 'bg-indigo-100 text-indigo-600' },
    biology: { id: 'biology', name: 'Biology', icon: '🧬', color: 'bg-green-100 text-green-600' },
    history: { id: 'history', name: 'History', icon: '🏛️', color: 'bg-amber-100 text-amber-600' },
    science: { id: 'science', name: 'Science', icon: '🔬', color: 'bg-sky-100 text-sky-600' },
    computer: { id: 'computer', name: 'Computer', icon: '💻', color: 'bg-violet-100 text-violet-600' },
};

export const LEARNING_RESOURCES: LearningResource[] = [
    {
        id: 'physics-laws-of-motion',
        slug: 'laws-of-motion',
        title: 'Unlock the Laws of Nature',
        subtitle: 'Understanding Newton\'s Laws of Motion',
        subject: SUBJECTS.physics,
        emoji: '📊',
        materialCount: 5,
        estimatedReadTime: 15,
        difficulty: 'medium',
        gradeLevel: '8-10',
        summary: 'Discover how objects move and why! Learn about Newton\'s three laws of motion that explain everything from a rolling ball to a rocket launch.',
        keyTakeaways: [
            'Objects stay still or keep moving until a force acts on them',
            'Force equals mass times acceleration (F = ma)',
            'Every action has an equal and opposite reaction',
            'These laws explain motion in our daily life',
        ],
        relatedResources: ['chemistry-foundations', 'geography-earth-secrets'],
        createdAt: '2024-01-15',
        updatedAt: '2024-01-20',
        sections: [
            {
                id: 'intro',
                title: 'What Are Laws of Motion?',
                type: 'text',
                content: `Have you ever wondered why a ball keeps rolling until it hits something? Or why you feel pushed back when a car suddenly speeds up? These everyday experiences are all explained by the **Laws of Motion**!

Sir Isaac Newton, a brilliant scientist from England, discovered these laws over 300 years ago. Legend says he got the idea when an apple fell on his head! Whether that story is true or not, his laws help us understand how everything in the universe moves.

**Laws of Motion** are rules that tell us:
- How objects start moving
- How objects stop moving
- How objects change direction
- Why objects move faster or slower

These laws work for everything – from tiny ants to giant airplanes!`,
            },
            {
                id: 'first-law',
                title: 'Newton\'s First Law: The Law of Inertia',
                type: 'text',
                content: `**Newton's First Law** says: *"An object at rest stays at rest, and an object in motion stays in motion at the same speed and direction, unless acted upon by an unbalanced force."*

That sounds complicated, but it's actually simple! Let's break it down:

**Part 1: Objects at rest stay at rest**
Think about a book on a table. It won't suddenly start moving on its own, right? It stays where you put it until someone picks it up or pushes it.

**Part 2: Moving objects keep moving**
Imagine you're on a skateboard rolling on a perfectly smooth road with no friction. You would keep rolling forever! In real life, friction (a force) eventually slows you down.

This tendency of objects to resist changes in motion is called **Inertia**. Heavy objects have more inertia than light objects. That's why it's harder to push a car than a shopping cart!`,
            },
            {
                id: 'first-law-example',
                title: 'Real-Life Examples of the First Law',
                type: 'example',
                content: `Here are some everyday examples of Newton's First Law:

🚗 **Seatbelts in Cars**: When a car suddenly stops, your body wants to keep moving forward (inertia). Seatbelts stop you from flying forward!

🏀 **Basketball Rolling**: A basketball keeps rolling until friction with the floor slows it down.

🎢 **Roller Coaster**: You feel pressed against your seat on a roller coaster because your body wants to keep moving in the original direction.

🥛 **Tablecloth Trick**: Magicians can pull a tablecloth from under dishes because the dishes have inertia and want to stay where they are!

🚌 **Standing in a Bus**: When a bus suddenly starts, you fall backward because your body was at rest and wants to stay at rest.`,
            },
            {
                id: 'second-law',
                title: 'Newton\'s Second Law: Force and Acceleration',
                type: 'text',
                content: `**Newton's Second Law** tells us exactly how force, mass, and acceleration are connected.

The famous formula is: **F = m × a**

Where:
- **F** = Force (measured in Newtons)
- **m** = Mass (measured in kilograms)
- **a** = Acceleration (measured in meters per second squared)

**What does this mean?**

1. **More force = More acceleration**: Push a toy car gently, it moves slowly. Push harder, it moves faster!

2. **More mass = Less acceleration** (with same force): It's easier to push an empty shopping cart than a full one. The full cart has more mass, so it accelerates less.

**Simple Example:**
Imagine kicking a football vs. kicking a bowling ball with the same force. The football flies far because it has less mass. The bowling ball barely moves because it has more mass!`,
            },
            {
                id: 'second-law-tip',
                title: 'Remember This Formula!',
                type: 'tip',
                content: `Here's a fun way to remember **F = ma**:

🎯 **"Force Makes Acceleration"** - Force equals Mass times Acceleration

Or think of it as:
- **F**orce is like pushing
- **m**ass is how heavy something is
- **a**cceleration is how fast it speeds up

**Memory Trick**: Imagine "FMA" as "Force Moves All" things!

When solving problems:
- If you know mass and acceleration, multiply them to find force
- If you know force and mass, divide to find acceleration
- If you know force and acceleration, divide to find mass`,
            },
            {
                id: 'third-law',
                title: 'Newton\'s Third Law: Action and Reaction',
                type: 'text',
                content: `**Newton's Third Law** states: *"For every action, there is an equal and opposite reaction."*

This is probably the most fun law to understand!

**What it means:**
When you push something, it pushes back on you with equal force but in the opposite direction.

**Important Points:**
- Both forces happen at the same time
- Both forces are equal in strength
- Both forces are in opposite directions
- The forces act on different objects

**Think about it this way:**
When you push against a wall, the wall pushes back against your hands! If the wall didn't push back, your hands would go right through it.`,
            },
            {
                id: 'third-law-examples',
                title: 'Action-Reaction in Daily Life',
                type: 'example',
                content: `Newton's Third Law is everywhere around us:

🚀 **Rockets**: Hot gases shoot down (action), rocket goes up (reaction)!

🏊 **Swimming**: You push water backward (action), water pushes you forward (reaction).

🚶 **Walking**: Your foot pushes the ground backward (action), ground pushes you forward (reaction).

🎈 **Releasing a Balloon**: Air rushes out one way (action), balloon flies the other way (reaction).

🛶 **Rowing a Boat**: Oar pushes water backward (action), boat moves forward (reaction).

🏀 **Bouncing Ball**: Ball pushes on floor (action), floor pushes ball up (reaction).

**Fun Thought**: When you jump, you push Earth down a tiny bit! But Earth is so massive, you can't see it move.`,
            },
            {
                id: 'activity',
                title: 'Try This at Home!',
                type: 'activity',
                content: `**Experiment 1: First Law with Coins**
Stack 5 coins on a table. Quickly flick the bottom coin out. The stack should stay in place because of inertia!

**Experiment 2: Second Law with Toy Cars**
Get a toy car. Push it gently, then push it hard. Notice how harder push = faster movement.
Now add some weight (like modeling clay) and push with the same force. It moves slower because of more mass!

**Experiment 3: Third Law with Balloons**
Blow up a balloon but don't tie it. Let it go! Watch it zoom around as air escapes. Air goes one way, balloon goes the other!

**Experiment 4: Walking in Socks**
Try walking on a smooth floor in socks vs. barefoot. With socks, there's less friction, so the "reaction" force is weaker, making it harder to push yourself forward!`,
            },
            {
                id: 'fun-facts',
                title: 'Amazing Facts About Motion!',
                type: 'fun-fact',
                content: `🌟 **Did You Know?**

1. **Space and Inertia**: In space, there's no friction or air resistance. If you threw a ball in space, it would keep moving forever in a straight line!

2. **The Apple Story**: The famous story about Newton and the apple might not be exactly true, but he did wonder why apples fall down instead of sideways or up!

3. **Fastest Man-Made Object**: The Parker Solar Probe uses Newton's laws to reach speeds of 430,000 mph – fast enough to travel from New York to London in about 30 seconds!

4. **Earth is Moving**: Right now, you're moving at about 1,000 mph as Earth rotates! You don't feel it because everything around you is moving at the same speed.

5. **Forces Everywhere**: Even when you're sitting still, many forces are acting on you – gravity pulling down, your chair pushing up, air pressure all around!`,
            },
            {
                id: 'summary',
                title: 'Quick Review',
                type: 'text',
                content: `Let's summarize what we learned:

**First Law (Inertia):**
Objects resist changes in motion. Things at rest stay at rest, things moving keep moving.

**Second Law (F = ma):**
Force equals mass times acceleration. More force or less mass means more acceleration.

**Third Law (Action-Reaction):**
Every action has an equal and opposite reaction. Forces always come in pairs.

**Why These Laws Matter:**
- Engineers use them to design cars, planes, and rockets
- Sports players use them to throw, kick, and hit better
- These laws help us understand nature and build amazing machines

**Remember:** Physics is all around us! Every time you walk, throw a ball, or ride a bike, you're experiencing Newton's Laws of Motion!`,
            },
        ],
    },
    {
        id: 'geography-earth-secrets',
        slug: 'mapping-earth-secrets',
        title: "Mapping the Earth's Secrets",
        subtitle: 'Understanding Our Planet\'s Geography',
        subject: SUBJECTS.geography,
        emoji: '🌍',
        materialCount: 5,
        estimatedReadTime: 12,
        difficulty: 'easy',
        gradeLevel: '5-8',
        summary: 'Explore the amazing features of our planet Earth! Learn about continents, oceans, mountains, and how maps help us understand our world.',
        keyTakeaways: [
            'Earth has 7 continents and 5 oceans',
            'Maps use symbols and scales to show information',
            'Geography helps us understand different places and cultures',
            'Earth\'s features are always changing slowly',
        ],
        relatedResources: ['physics-laws-of-motion', 'chemistry-foundations'],
        createdAt: '2024-01-10',
        updatedAt: '2024-01-18',
        sections: [
            {
                id: 'intro',
                title: 'Welcome to Geography!',
                type: 'text',
                content: `**Geography** is the study of Earth and everything on it! It helps us understand:
- Where places are located
- What different regions look like
- How people live in different parts of the world
- How Earth's features formed and continue to change

Think of geography as Earth's story – a story of mountains, rivers, deserts, forests, and all the amazing places where people live.

**Why is Geography Important?**
When you look at a map, order food from another country, or plan a vacation, you're using geography! It helps us:
- Navigate and find places
- Understand weather and climate
- Learn about different cultures
- Protect our environment`,
            },
            {
                id: 'continents',
                title: 'The Seven Continents',
                type: 'text',
                content: `Earth has **seven continents** – large landmasses where most life exists. Let's explore each one!

**1. Asia** 🏯
- The largest continent
- Home to over 4 billion people
- Contains Mount Everest, the tallest mountain
- Countries: India, China, Japan, and many more

**2. Africa** 🦁
- Second largest continent
- Has the Sahara Desert (world's largest hot desert)
- Contains the Nile River (world's longest river)
- Amazing wildlife like lions, elephants, and giraffes

**3. North America** 🗽
- Third largest continent
- Contains USA, Canada, and Mexico
- Has the Grand Canyon and Great Lakes

**4. South America** 🌴
- Fourth largest continent
- Home to the Amazon Rainforest
- Contains the Andes Mountains

**5. Antarctica** 🐧
- Coldest continent
- Covered almost entirely in ice
- No permanent human residents, only researchers

**6. Europe** 🏰
- Sixth largest but very influential
- Many historic cities and castles
- Countries: France, Germany, Italy, UK, and more

**7. Australia** 🦘
- Smallest continent (also a country!)
- Unique animals like kangaroos and koalas
- Has the Great Barrier Reef`,
            },
            {
                id: 'oceans',
                title: 'The Five Oceans',
                type: 'text',
                content: `About **71% of Earth is covered by water**, mostly in five great oceans!

**1. Pacific Ocean** 🌊
- The largest and deepest ocean
- Contains the Mariana Trench (deepest point on Earth)
- Name means "peaceful" in Latin

**2. Atlantic Ocean** 🚢
- Second largest ocean
- Separates Americas from Europe and Africa
- The Titanic sank here in 1912

**3. Indian Ocean** 🐠
- Third largest ocean
- Warmest ocean in the world
- Rich in marine life

**4. Southern Ocean** 🧊
- Surrounds Antarctica
- Very cold waters
- Home to penguins and seals

**5. Arctic Ocean** ❄️
- Smallest and shallowest ocean
- Located around the North Pole
- Partly covered by sea ice

**Ocean Facts:**
- Oceans produce over 50% of Earth's oxygen
- We've explored less than 5% of the ocean!
- The blue color comes from sunlight reflecting`,
            },
            {
                id: 'landforms',
                title: 'Amazing Landforms',
                type: 'text',
                content: `Earth has many different types of **landforms** – shapes and features of the land:

**Mountains** ⛰️
- High, raised areas with peaks
- Formed when Earth's plates push together
- Famous: Himalayas, Alps, Rockies

**Valleys** 🏞️
- Low areas between mountains or hills
- Often have rivers flowing through them
- Great for farming

**Plains** 🌾
- Flat, wide areas of land
- Good for agriculture
- Example: Great Plains of North America

**Deserts** 🏜️
- Very dry areas with little rain
- Can be hot (Sahara) or cold (Gobi)
- Special plants and animals live here

**Rivers** 🌊
- Flowing water from mountains to sea
- Important for drinking, farming, and transport
- Famous: Amazon, Nile, Ganges

**Islands** 🏝️
- Land surrounded by water on all sides
- Some are tropical paradises
- Japan, UK, and Madagascar are island nations`,
            },
            {
                id: 'maps-tip',
                title: 'How to Read Maps',
                type: 'tip',
                content: `Maps are like pictures of Earth from above. Here's how to read them:

**1. Title** 📋
Always read the title first! It tells you what the map shows.

**2. Legend/Key** 🗝️
This explains what symbols and colors mean:
- Blue usually = water
- Green often = forests or parks
- Red lines might = highways

**3. Scale** 📏
Shows how distance on the map relates to real distance.
Example: 1 inch = 100 miles

**4. Compass Rose** 🧭
Shows directions:
- N = North (up)
- S = South (down)
- E = East (right)
- W = West (left)

**5. Grid Lines** 📐
Help locate places using coordinates (like A-3 or B-7)

**Pro Tip:** Remember "Never Eat Soggy Waffles" for directions: North, East, South, West (going clockwise)!`,
            },
            {
                id: 'climate-zones',
                title: 'Climate Zones',
                type: 'text',
                content: `Different parts of Earth have different **climates** – the usual weather patterns over a long time:

**Tropical Zone** 🌴
- Near the equator
- Hot and wet all year
- Dense rainforests
- Countries: Brazil, Indonesia, Kenya

**Dry Zone** 🏜️
- Deserts and semi-deserts
- Very little rainfall
- Extreme temperatures
- Places: Sahara, Arabian Desert

**Temperate Zone** 🍂
- Between tropics and poles
- Four distinct seasons
- Most comfortable for humans
- Places: USA, Europe, Japan

**Continental Zone** 🌨️
- Interior of large continents
- Cold winters, warm summers
- Large temperature variations

**Polar Zone** ❄️
- Near North and South Poles
- Very cold all year
- Ice and snow covered
- Places: Antarctica, Arctic`,
            },
            {
                id: 'earth-changes',
                title: 'Earth is Always Changing!',
                type: 'fun-fact',
                content: `Our planet never stops changing! Here are some amazing facts:

🌋 **Volcanoes Create New Land**
When volcanoes erupt, lava cools and forms new rock. The Hawaiian islands were created by volcanoes!

🏔️ **Mountains Are Still Growing**
The Himalayas grow about 1 cm taller each year because of plate movement. Mount Everest is getting taller!

🌊 **Continents Are Moving**
All continents were once joined as one supercontinent called "Pangaea." They're still moving (very slowly)!

🏖️ **Coastlines Change**
Waves and wind constantly reshape beaches and cliffs. Some places lose land while others gain it.

🌍 **Plates and Earthquakes**
Earth's surface is made of giant plates that float on hot rock below. When they bump or slide, we get earthquakes!

**Cool Fact:** About 250 million years ago, you could walk from Africa to South America because they were connected!`,
            },
            {
                id: 'activity-geo',
                title: 'Geography Activities!',
                type: 'activity',
                content: `**Activity 1: Make a Simple Map**
Draw a map of your room or house from above. Include:
- A title
- A compass showing North
- Symbols for furniture (create your own legend!)

**Activity 2: Continent Game**
Without looking, write down all 7 continents in order from largest to smallest. Then check your answers!
(Answer: Asia, Africa, North America, South America, Antarctica, Europe, Australia)

**Activity 3: Virtual Travel**
Pick a country you've never been to. Research:
- What continent it's on
- Its capital city
- One famous landmark
- What language people speak

**Activity 4: Weather Watch**
Keep a weather diary for one week:
- Record temperature, sky condition, and wind
- Notice patterns – is it getting warmer or cooler?

**Activity 5: Find Your Location**
Using a map or globe, find:
- Your country
- Your nearest ocean
- The continent you're on
- The equator (is it north or south of you?)`,
            },
            {
                id: 'summary-geo',
                title: 'What We Learned',
                type: 'text',
                content: `**Quick Review:**

✅ **Continents**: 7 great landmasses - Asia, Africa, North America, South America, Antarctica, Europe, Australia

✅ **Oceans**: 5 bodies of water - Pacific, Atlantic, Indian, Southern, Arctic

✅ **Landforms**: Mountains, valleys, plains, deserts, rivers, and islands

✅ **Maps**: Use title, legend, scale, and compass to understand maps

✅ **Climate Zones**: Tropical, Dry, Temperate, Continental, Polar

✅ **Earth Changes**: Our planet is always slowly changing through volcanoes, erosion, and plate movement

**Geography helps us understand our world and appreciate how amazing and diverse our planet is!**

**Fun Challenge:** Can you name one country from each continent?`,
            },
        ],
    },
    {
        id: 'chemistry-foundations',
        slug: 'foundations-of-chemistry',
        title: 'Foundations of Chemistry',
        subtitle: 'Discover the Building Blocks of Everything',
        subject: SUBJECTS.chemistry,
        emoji: '🧪',
        materialCount: 5,
        estimatedReadTime: 14,
        difficulty: 'medium',
        gradeLevel: '6-9',
        summary: 'Everything around you is made of chemicals! Learn about atoms, elements, and how substances combine to create the world we see.',
        keyTakeaways: [
            'Everything is made of tiny particles called atoms',
            'Elements are pure substances that cannot be broken down',
            'The Periodic Table organizes all elements',
            'Chemical reactions create new substances',
        ],
        relatedResources: ['physics-laws-of-motion', 'geography-earth-secrets'],
        createdAt: '2024-01-12',
        updatedAt: '2024-01-22',
        sections: [
            {
                id: 'intro-chem',
                title: 'What is Chemistry?',
                type: 'text',
                content: `**Chemistry** is the science of matter – what things are made of and how they interact!

Every single thing you can see, touch, smell, or taste is made of **chemicals**. Yes, even you! Your body is made of chemicals like water, carbon, oxygen, and many more.

**Chemistry answers questions like:**
- What is air made of?
- Why does ice melt?
- How do fireworks get their colors?
- Why does soap clean things?

**Where do we use chemistry?**
- Cooking food 🍳
- Taking medicine 💊
- Using cleaning products 🧼
- Making plastics and clothes 👕
- Understanding our environment 🌿

Chemistry is everywhere – let's explore!`,
            },
            {
                id: 'atoms',
                title: 'Atoms: The Tiny Building Blocks',
                type: 'text',
                content: `Everything in the universe is made of incredibly tiny particles called **atoms**!

**How small are atoms?**
A single drop of water contains about 1,700,000,000,000,000,000,000 atoms! That's 1.7 sextillion – a number so big it's hard to imagine.

**What's inside an atom?**
Atoms have three main parts:

**1. Protons** ⚡ (positive charge)
- Found in the center (nucleus)
- Determine which element it is

**2. Neutrons** ⭕ (no charge)
- Also in the nucleus
- Add mass to the atom

**3. Electrons** ⚫ (negative charge)
- Zoom around the nucleus
- Super tiny and fast
- Involved in chemical reactions

**Fun Analogy:**
Imagine the atom's nucleus is a marble in the center of a football stadium. The electrons would be like tiny flies buzzing around the stadium's outer seats!`,
            },
            {
                id: 'elements',
                title: 'Elements: Pure Substances',
                type: 'text',
                content: `**Elements** are pure substances made of only one type of atom. They cannot be broken down into simpler substances.

**There are about 118 elements!**

Some elements you should know:

**Oxygen (O)** 💨
- Makes up 21% of air we breathe
- Essential for life
- Found in water (H₂O)

**Hydrogen (H)** 💧
- Lightest element
- Most abundant in the universe
- Part of water

**Carbon (C)** 🪨
- Found in all living things
- Makes diamonds and graphite
- In the fuel we burn

**Gold (Au)** 🥇
- Precious metal
- Doesn't rust or tarnish
- Used in jewelry and electronics

**Iron (Fe)** 🔧
- Makes up Earth's core
- Used in building and tools
- In your blood!

**Each element has:**
- A name
- A symbol (1-2 letters)
- A unique number of protons`,
            },
            {
                id: 'periodic-table',
                title: 'The Periodic Table',
                type: 'text',
                content: `The **Periodic Table** is like a map of all elements! Scientists use it to understand and organize elements.

**How it's organized:**

**Rows (Periods):** 7 horizontal rows
- Elements in the same row have the same number of electron shells

**Columns (Groups):** 18 vertical columns
- Elements in the same group behave similarly

**Important Groups:**

**Group 1 - Alkali Metals** 🔥
- Very reactive!
- Soft metals
- Examples: Sodium (Na), Potassium (K)

**Group 17 - Halogens** ⚡
- Very reactive non-metals
- Used in disinfectants
- Examples: Chlorine (Cl), Fluorine (F)

**Group 18 - Noble Gases** 💨
- Don't react with other elements
- Used in lights
- Examples: Helium (He), Neon (Ne)

**Metals vs Non-Metals:**
- Left side: Mostly metals (shiny, conduct electricity)
- Right side: Non-metals (don't conduct, different properties)`,
            },
            {
                id: 'periodic-tip',
                title: 'Memorizing the Periodic Table',
                type: 'tip',
                content: `Here are some fun ways to remember the first few elements!

**First 10 Elements:**
Hydrogen (H), Helium (He), Lithium (Li), Beryllium (Be), Boron (B), Carbon (C), Nitrogen (N), Oxygen (O), Fluorine (F), Neon (Ne)

**Memory Phrase:**
**"Hi Hello Little Bear, Brown Cat Naps On Fluffy Nests"**

H - Hi (Hydrogen)
He - Hello (Helium)
Li - Little (Lithium)
Be - Bear (Beryllium)
B - Brown (Boron)
C - Cat (Carbon)
N - Naps (Nitrogen)
O - On (Oxygen)
F - Fluffy (Fluorine)
Ne - Nests (Neon)

**Symbol Tips:**
- Most symbols = first 1-2 letters of name
- Some have Latin origins:
  - Gold = Au (Aurum)
  - Iron = Fe (Ferrum)
  - Lead = Pb (Plumbum)`,
            },
            {
                id: 'compounds',
                title: 'Molecules and Compounds',
                type: 'text',
                content: `When atoms join together, they form **molecules** and **compounds**!

**Molecules:**
Two or more atoms bonded together.
- Can be same element: O₂ (oxygen gas)
- Can be different: H₂O (water)

**Compounds:**
Molecules made of different elements bonded together.

**Famous Compounds:**

**Water (H₂O)** 💧
- 2 hydrogen atoms + 1 oxygen atom
- Essential for all life
- Covers 71% of Earth

**Carbon Dioxide (CO₂)** 🌫️
- 1 carbon + 2 oxygen atoms
- We breathe this out
- Plants use it to make food

**Table Salt (NaCl)** 🧂
- 1 sodium + 1 chlorine
- We eat it every day
- Made from a reactive metal and a poisonous gas!

**Sugar (C₆H₁₂O₆)** 🍬
- 6 carbon + 12 hydrogen + 6 oxygen
- Gives us energy
- Found in fruits and sweets

**The subscript numbers tell us how many atoms!**`,
            },
            {
                id: 'reactions',
                title: 'Chemical Reactions',
                type: 'text',
                content: `A **chemical reaction** happens when substances combine or break apart to form new substances!

**Signs of a Chemical Reaction:**
1. 🎨 Color change
2. 💨 Gas bubbles form
3. 🌡️ Temperature changes (gets hot or cold)
4. 💡 Light is produced
5. 🧪 New substance forms

**Types of Reactions:**

**Combination** ➕
Two substances join to make one.
Example: Iron + Oxygen → Rust

**Decomposition** ➗
One substance breaks into smaller parts.
Example: Water → Hydrogen + Oxygen (with electricity)

**Combustion** 🔥
Substance burns with oxygen.
Example: Wood + Oxygen → Carbon Dioxide + Water + Heat

**Chemical Equations:**
Scientists write reactions like math equations!

**Reactants → Products**

Example: 2H₂ + O₂ → 2H₂O
(Hydrogen + Oxygen → Water)`,
            },
            {
                id: 'reactions-example',
                title: 'Cool Chemical Reactions',
                type: 'example',
                content: `**Everyday Chemical Reactions:**

🍞 **Baking Bread**
Yeast releases carbon dioxide gas, making dough rise. That's why bread is fluffy!

🍎 **Apple Turning Brown**
Oxygen in air reacts with apple's surface. It's called oxidation.

🔥 **Lighting a Match**
Friction creates heat, which starts a combustion reaction with chemicals on the match head.

🥛 **Milk Going Sour**
Bacteria cause chemical changes in milk, producing lactic acid.

🧼 **Soap Cleaning**
Soap molecules grab onto grease and water, creating a chemical interaction that washes dirt away.

🦷 **Toothpaste Fighting Cavities**
Fluoride in toothpaste reacts with your tooth enamel, making it stronger!

⚡ **Batteries Powering Devices**
Chemical reactions inside batteries produce electricity. When chemicals are used up, the battery dies.`,
            },
            {
                id: 'states-matter',
                title: 'States of Matter',
                type: 'text',
                content: `Matter exists in three main **states**: solid, liquid, and gas!

**Solid** 🧊
- Has definite shape and volume
- Particles packed tightly
- Vibrate in place
- Examples: Ice, wood, metal

**Liquid** 💧
- Has definite volume but takes container's shape
- Particles close but can slide past each other
- Can flow and pour
- Examples: Water, milk, oil

**Gas** 💨
- No definite shape or volume
- Particles spread out and move freely
- Fills entire container
- Examples: Air, steam, helium

**Changing States:**

🧊 → 💧 **Melting** (solid to liquid)
- Add heat
- Ice becomes water

💧 → 💨 **Evaporation/Boiling** (liquid to gas)
- Add more heat
- Water becomes steam

💨 → 💧 **Condensation** (gas to liquid)
- Remove heat
- Steam becomes water droplets

💧 → 🧊 **Freezing** (liquid to solid)
- Remove more heat
- Water becomes ice`,
            },
            {
                id: 'activity-chem',
                title: 'Try These Chemistry Experiments!',
                type: 'activity',
                content: `**Experiment 1: Invisible Ink** (with adult supervision)
Materials: Lemon juice, paper, cotton swab, heat source
1. Write a message with lemon juice using cotton swab
2. Let it dry (it becomes invisible!)
3. Heat the paper carefully
4. The message appears! (Heat causes a chemical reaction)

**Experiment 2: Volcano Reaction**
Materials: Baking soda, vinegar, container
1. Put baking soda in container
2. Add vinegar
3. Watch it fizz! (Acid-base reaction produces CO₂ gas)

**Experiment 3: Dancing Raisins**
Materials: Clear soda, raisins
1. Drop raisins into soda
2. Watch them rise and sink
3. CO₂ bubbles stick to raisins, making them float!

**Experiment 4: Color-Changing Cabbage**
Materials: Red cabbage, water, different liquids
1. Boil red cabbage to make purple juice
2. Add different liquids (lemon juice, baking soda solution)
3. Watch colors change! (Indicates acids and bases)

**Always get adult permission and supervision for experiments!**`,
            },
            {
                id: 'fun-facts-chem',
                title: 'Amazing Chemistry Facts!',
                type: 'fun-fact',
                content: `🌟 **Mind-Blowing Facts:**

**1. You're Made of Stars!** ⭐
The atoms in your body were created in stars billions of years ago. We're literally made of stardust!

**2. Diamonds and Pencils are Related** 💎✏️
Both diamonds and pencil graphite are made of pure carbon. The difference? How the atoms are arranged!

**3. Gold is Edible** 🥇
You can eat pure gold! It's sometimes used to decorate fancy desserts. It passes through your body unchanged.

**4. Bananas are Radioactive** 🍌
Bananas contain potassium, some of which is naturally radioactive. Don't worry – you'd need to eat millions to be affected!

**5. Water Can Boil and Freeze at Same Time** 🌡️
At certain conditions (triple point), water can exist as solid, liquid, and gas simultaneously!

**6. Your Body Contains Enough Iron for a Nail** 🔩
There's about 4 grams of iron in your blood!`,
            },
            {
                id: 'summary-chem',
                title: 'Chemistry Summary',
                type: 'text',
                content: `**Let's review what we learned!**

✅ **Atoms** are tiny particles that make up everything. They have protons, neutrons, and electrons.

✅ **Elements** are pure substances made of one type of atom. There are 118 known elements.

✅ **Periodic Table** organizes elements by their properties in rows and columns.

✅ **Molecules** form when atoms bond together. Compounds have different elements.

✅ **Chemical Reactions** create new substances. Signs include color change, gas bubbles, and temperature change.

✅ **States of Matter** are solid, liquid, and gas. Adding or removing heat changes states.

**Chemistry is the science of how matter behaves and transforms. It's happening all around you, all the time!**

**Question to Think About:** What chemical reactions happened in your home today?`,
            },
        ],
    },
    {
        id: 'business-strategy-essentials',
        slug: 'business-strategy-essentials',
        title: 'Business Strategy Essentials',
        subtitle: 'Learn How Businesses Work and Grow',
        subject: SUBJECTS.business,
        emoji: '💼',
        materialCount: 8,
        estimatedReadTime: 18,
        difficulty: 'medium',
        gradeLevel: '7-10',
        summary: 'Discover how businesses start, grow, and succeed! Learn about entrepreneurship, marketing, and what makes companies successful.',
        keyTakeaways: [
            'Business is about solving problems and adding value',
            'Entrepreneurs identify needs and create solutions',
            'Marketing helps customers learn about products',
            'Good planning and management lead to success',
        ],
        relatedResources: ['physics-laws-of-motion', 'geography-earth-secrets', 'chemistry-foundations'],
        createdAt: '2024-01-08',
        updatedAt: '2024-01-25',
        sections: [
            {
                id: 'intro-business',
                title: 'What is Business?',
                type: 'text',
                content: `**Business** is any activity where people create value by providing products or services to others!

**Simple Definition:**
A business solves problems or meets needs, and in return, earns money.

**Examples of Businesses:**
- 🍕 Pizza shop → Solves hunger
- 📱 Phone company → Helps people communicate
- 🏥 Hospital → Provides healthcare
- 🎮 Game developer → Provides entertainment
- 📚 Bookstore → Provides knowledge and stories

**Why do Businesses Exist?**
1. To meet people's needs and wants
2. To create jobs for workers
3. To earn profits for owners
4. To improve our lives with new products

**Did you know?** Every product you use came from a business – your clothes, food, phone, and even this website!`,
            },
            {
                id: 'entrepreneurs',
                title: 'Entrepreneurs: Business Starters',
                type: 'text',
                content: `**Entrepreneurs** are people who start and run businesses. They turn ideas into reality!

**What do Entrepreneurs Do?**
- Identify problems that need solving
- Create products or services
- Take risks with their time and money
- Lead teams and make decisions
- Adapt when things don't go as planned

**Famous Entrepreneurs:**

**Elon Musk** 🚗🚀
- Started Tesla (electric cars)
- SpaceX (rockets)
- Wanted to help the planet and explore space

**Sara Blakely** 👗
- Created Spanx (clothing)
- Started with just $5,000
- Became a billionaire!

**Steve Jobs** 🍎
- Co-founded Apple
- Changed how we use computers and phones
- Focused on beautiful, simple design

**Qualities of Good Entrepreneurs:**
✅ Curious and creative
✅ Hardworking and persistent
✅ Willing to learn from failures
✅ Good at solving problems
✅ Able to inspire others`,
            },
            {
                id: 'business-types',
                title: 'Types of Businesses',
                type: 'text',
                content: `Businesses come in many different types and sizes!

**By What They Sell:**

**Product-Based** 📦
- Sell physical items
- Examples: Clothes, food, electronics
- Need to make or buy products

**Service-Based** 🛠️
- Sell skills and expertise
- Examples: Haircuts, tutoring, repairs
- Sell time and knowledge

**By Size:**

**Small Business** 🏪
- Usually owned by few people
- Local or regional
- Examples: Corner store, local restaurant

**Medium Business** 🏢
- Growing companies
- More employees and locations
- Examples: Regional chain stores

**Large Corporation** 🏙️
- Huge companies
- Thousands of employees
- Global reach
- Examples: Amazon, Google, Nike

**By Industry:**
- 🏭 Manufacturing (making things)
- 🛒 Retail (selling to customers)
- 🍔 Food & Restaurant
- 💻 Technology
- 🏥 Healthcare
- 📚 Education
- 🎬 Entertainment`,
            },
            {
                id: 'supply-demand',
                title: 'Supply and Demand',
                type: 'text',
                content: `**Supply and Demand** is a basic law of economics that affects all businesses!

**Demand** 📈
How much people want to buy something.
- High demand = Many people want it
- Low demand = Few people want it

**Supply** 📊
How much of something is available.
- High supply = Lots available
- Low supply = Not much available

**How They Work Together:**

**Scenario 1: High Demand + Low Supply = HIGH PRICE**
- Example: New iPhone on launch day
- Everyone wants it, few available
- Price stays high

**Scenario 2: Low Demand + High Supply = LOW PRICE**
- Example: Winter coats in summer
- Few people want them
- Stores have sales to sell them

**Scenario 3: Balance**
- When supply meets demand
- Prices stabilize
- Everyone who wants it can buy it

**Real World Example:** 🎮
New video game console:
- Launch: High demand, low supply → Hard to find, high prices
- Later: More made, demand decreases → Easier to buy, prices drop`,
            },
            {
                id: 'marketing-basics',
                title: 'Marketing: Spreading the Word',
                type: 'text',
                content: `**Marketing** is how businesses tell people about their products and convince them to buy!

**The 4 Ps of Marketing:**

**1. Product** 📦
- What you're selling
- Features and benefits
- Quality and design
- Why it's better than others

**2. Price** 💰
- How much it costs
- Fair value for customers
- Covers costs and profit
- Competitive with similar products

**3. Place** 📍
- Where customers can buy it
- Online, stores, or both
- Convenient locations
- Available when needed

**4. Promotion** 📣
- How you tell people about it
- Advertising (TV, online, posters)
- Social media
- Word of mouth

**Types of Marketing:**
- 📺 TV and radio ads
- 📱 Social media marketing
- 📧 Email marketing
- 🌐 Website and SEO
- 👥 Influencer marketing
- 🗣️ Word of mouth`,
            },
            {
                id: 'marketing-tip',
                title: 'Thinking Like a Marketer',
                type: 'tip',
                content: `Here's how to think about marketing any product:

**Ask These Questions:**

**1. Who is my customer?** 👤
- Age group?
- What do they like?
- What problems do they have?
- Where do they spend time?

**2. What problem am I solving?** 🎯
- What need does my product meet?
- How does it make life better?
- What makes it special?

**3. Why should they choose me?** ⭐
- What makes my product different?
- Is it cheaper? Better? Faster?
- What do customers say about it?

**4. How will they find me?** 🔍
- What websites do they visit?
- What social media do they use?
- Where do they shop?

**Marketing Message Formula:**
"For [customers] who [have this problem], our [product] provides [solution] because [reason]."

**Example:**
"For students who struggle with math, our tutoring app provides personalized lessons because every student learns differently."`,
            },
            {
                id: 'money-business',
                title: 'Money in Business',
                type: 'text',
                content: `Understanding money is essential for any business!

**Key Terms:**

**Revenue** 💵
- All the money a business earns
- From selling products or services
- Also called "sales"

**Expenses/Costs** 💸
- Money the business spends
- Rent, salaries, supplies, etc.
- Needed to run the business

**Profit** 📈
- Revenue minus Expenses
- What's left over after paying costs
- **Profit = Revenue - Expenses**

**Example:**
A lemonade stand:
- Revenue: Sold 50 cups at ₹10 each = ₹500
- Expenses: Lemons, sugar, cups = ₹200
- Profit: ₹500 - ₹200 = ₹300 profit! 🎉

**Why Profit Matters:**
- Pays the business owner
- Allows business to grow
- Creates savings for hard times
- Can be reinvested to improve

**Types of Costs:**
- **Fixed Costs:** Same every month (rent, salaries)
- **Variable Costs:** Change with sales (materials, shipping)`,
            },
            {
                id: 'business-plan',
                title: 'Creating a Business Plan',
                type: 'text',
                content: `A **Business Plan** is a roadmap for your business idea!

**What's in a Business Plan?**

**1. Executive Summary** 📋
- Brief overview of the whole plan
- What your business does
- Your goals

**2. Business Description** 🏢
- What products/services you offer
- What problem you solve
- What makes you different

**3. Market Analysis** 🔍
- Who your customers are
- Who your competitors are
- Size of opportunity

**4. Marketing Strategy** 📣
- How you'll attract customers
- Pricing strategy
- Sales approach

**5. Operations Plan** ⚙️
- How the business runs day-to-day
- Location, equipment needed
- Suppliers and partners

**6. Financial Plan** 💰
- Startup costs
- Expected revenue
- Profit projections

**7. Team** 👥
- Who's involved
- Their skills and experience
- Roles and responsibilities`,
            },
            {
                id: 'business-success',
                title: 'What Makes Businesses Successful?',
                type: 'text',
                content: `Successful businesses share common traits:

**1. They Solve Real Problems** 🎯
- Meet genuine customer needs
- Provide clear value
- Make people's lives better

**2. They Know Their Customers** 👥
- Understand who buys from them
- Listen to feedback
- Adapt to changing needs

**3. They Manage Money Well** 💰
- Track income and expenses
- Plan for the future
- Don't overspend

**4. They Adapt to Change** 🔄
- Stay flexible
- Embrace new technology
- Learn from mistakes

**5. They Have Great Teams** 👫
- Hire good people
- Treat employees well
- Clear communication

**6. They Deliver Quality** ⭐
- Products/services work well
- Consistent experience
- Customers trust them

**7. They Build Relationships** 🤝
- Good customer service
- Strong partnerships
- Positive reputation

**Remember:** Success takes time! Most successful businesses failed many times before getting it right.`,
            },
            {
                id: 'business-examples',
                title: 'Business Success Stories',
                type: 'example',
                content: `**Inspiring Business Stories:**

**🍎 Apple**
- Started in a garage
- Almost went bankrupt in 1997
- Focused on beautiful, simple products
- Now one of the most valuable companies

**📚 Amazon**
- Started selling books online
- Lost money for many years
- Kept growing and trying new things
- Now sells almost everything!

**🍔 McDonald's**
- Started as one small restaurant
- Created a system that could be copied
- Expanded worldwide with franchises
- Serves 69 million people daily!

**🎮 Nintendo**
- Started in 1889 making playing cards!
- Almost failed multiple times
- Pivoted to video games
- Created Mario, Pokemon, and more

**Key Lessons:**
✅ Start small and grow
✅ Be willing to change direction
✅ Focus on what makes you special
✅ Never give up after setbacks
✅ Listen to your customers`,
            },
            {
                id: 'ethics-business',
                title: 'Business Ethics',
                type: 'text',
                content: `**Ethics** means doing the right thing, even when no one is watching!

**Why Ethics Matter in Business:**

1. **Trust** 🤝
- Customers buy from businesses they trust
- Reputation takes years to build, seconds to destroy

2. **Long-term Success** 📈
- Ethical businesses last longer
- Customers stay loyal

3. **Employee Happiness** 😊
- Good people want to work for ethical companies
- Better teamwork and productivity

**Ethical Business Practices:**

✅ **Honesty**
- Truthful advertising
- Fair pricing
- No hidden fees

✅ **Fairness**
- Treat employees well
- Fair competition
- Equal opportunities

✅ **Responsibility**
- Care for environment
- Give back to community
- Admit and fix mistakes

✅ **Respect**
- Privacy of customers
- Diversity and inclusion
- Safe working conditions

**Unethical Practices to Avoid:**
❌ Lying to customers
❌ Copying others' work
❌ Treating workers poorly
❌ Polluting the environment`,
            },
            {
                id: 'activity-business',
                title: 'Business Activities!',
                type: 'activity',
                content: `**Activity 1: Lemonade Stand Business Plan** 🍋
Create a simple business plan:
- What will you sell? (Lemonade, cookies, etc.)
- How much will you charge?
- What supplies do you need and cost?
- Who will buy from you?
- How will you let people know?
- Calculate expected profit!

**Activity 2: Supply and Demand Game** 📊
Pick a product you like. Think about:
- What would make demand go up?
- What would make supply go down?
- How would that affect price?

**Activity 3: Marketing Your Favorite Product** 📣
Choose something you love. Create a marketing plan:
- Who would want this product?
- Write a 30-second commercial script
- Design a poster/ad for it
- Choose 3 places to advertise

**Activity 4: Spot the Strategy** 🔍
Next time you see an ad:
- Who is it targeting?
- What problem does it solve?
- What makes it memorable?

**Activity 5: Business Idea Generator** 💡
Think of a problem you or friends have.
- What solution could help?
- Would people pay for it?
- How would you create it?`,
            },
            {
                id: 'summary-business',
                title: 'Business Essentials Summary',
                type: 'text',
                content: `**What We Learned:**

✅ **Business** is about solving problems and creating value for customers.

✅ **Entrepreneurs** start businesses by identifying needs and creating solutions.

✅ **Types of Businesses** include product/service-based, small to large corporations.

✅ **Supply and Demand** affect prices – high demand with low supply means higher prices.

✅ **Marketing** uses the 4 Ps: Product, Price, Place, Promotion.

✅ **Profit** = Revenue - Expenses (what's left after paying costs)

✅ **Business Plans** are roadmaps that guide business success.

✅ **Ethics** in business builds trust and long-term success.

**Business is everywhere around us, and understanding how it works helps us make better decisions as both creators and consumers!**

**Challenge:** Next time you buy something, think about:
- What business made it?
- How did they market to you?
- What problem did they solve?`,
            },
        ],
    },
    // ============================================
    // ENGLISH - Parts of Speech
    // ============================================
    {
        id: 'english-parts-of-speech',
        slug: 'parts-of-speech-guide',
        title: 'Master the Building Blocks of English',
        subtitle: 'Understanding Parts of Speech Made Simple',
        subject: SUBJECTS.english,
        emoji: '📚',
        materialCount: 6,
        estimatedReadTime: 12,
        difficulty: 'easy',
        gradeLevel: '5-7',
        summary: 'Learn the eight parts of speech that form the foundation of every sentence. From nouns to interjections, discover how words work together to create meaning.',
        keyTakeaways: [
            'Nouns name people, places, things, and ideas',
            'Verbs show action or state of being',
            'Adjectives and adverbs add description',
            'Pronouns replace nouns to avoid repetition',
        ],
        relatedResources: ['biology-human-body', 'mathematics-fractions'],
        createdAt: '2024-02-01',
        updatedAt: '2024-02-10',
        sections: [
            {
                id: 'intro-english',
                title: 'What Are Parts of Speech?',
                type: 'text',
                content: `Every word you speak or write belongs to a **part of speech**. Think of them as different types of Lego blocks that fit together to build sentences!

There are **8 parts of speech** in English:
- Nouns
- Pronouns
- Verbs
- Adjectives
- Adverbs
- Prepositions
- Conjunctions
- Interjections

**Why does this matter?**
Understanding parts of speech helps you:
- Write clearer sentences
- Spot and fix grammar mistakes
- Become a better reader
- Express yourself more precisely

Let's explore each one with fun examples!`,
            },
            {
                id: 'nouns-pronouns',
                title: 'Nouns and Pronouns',
                type: 'text',
                content: `**NOUNS** are naming words. They name:

**People:** teacher, doctor, Rahul, mother
**Places:** school, India, park, kitchen
**Things:** book, phone, table, car
**Ideas:** happiness, freedom, love, courage

**Types of Nouns:**
- **Common nouns:** general names (city, dog, day)
- **Proper nouns:** specific names (Mumbai, Rex, Monday) – always capitalized!

**PRONOUNS** replace nouns to avoid repetition:

Instead of: *Priya went to Priya's house because Priya was tired.*
Say: *Priya went to her house because she was tired.*

**Common pronouns:**
- I, me, my, mine
- You, your, yours
- He, she, it, they
- We, us, our, ours
- This, that, these, those`,
            },
            {
                id: 'verbs',
                title: 'Verbs: The Action Words',
                type: 'text',
                content: `**VERBS** are doing words or being words. Every sentence needs at least one verb!

**Action Verbs** show what someone does:
- run, jump, write, eat, think, play, study

**Linking Verbs** connect the subject to more information:
- is, am, are, was, were, seem, become, feel

**Examples:**
- The cat **sleeps** on the sofa. (action)
- She **is** a doctor. (linking)
- They **are** happy. (linking)

**Verb Tenses** show when something happens:
- **Past:** I walked to school.
- **Present:** I walk to school.
- **Future:** I will walk to school.

**Helping Verbs** work with main verbs:
- is, am, are, was, were
- have, has, had
- will, would, shall, should
- can, could, may, might`,
            },
            {
                id: 'adjectives-adverbs',
                title: 'Adjectives and Adverbs: Adding Details',
                type: 'tip',
                content: `**ADJECTIVES** describe nouns. They tell us:
- **What kind?** – red apple, tall building, funny joke
- **How many?** – three cats, many books, few people
- **Which one?** – this car, that house, these shoes

**ADVERBS** describe verbs, adjectives, or other adverbs. They tell us:
- **How?** – slowly, quickly, carefully, loudly
- **When?** – yesterday, now, soon, always
- **Where?** – here, there, everywhere, outside
- **How much?** – very, quite, almost, extremely

**Spot the difference:**
- She has a **beautiful** voice. (beautiful = adjective, describes voice)
- She sings **beautifully**. (beautifully = adverb, describes how she sings)

**Tip:** Many adverbs end in "-ly" but not all!
- Fast (adjective: a fast car)
- Fast (adverb: she runs fast)`,
            },
            {
                id: 'prepositions-conjunctions',
                title: 'Prepositions and Conjunctions',
                type: 'text',
                content: `**PREPOSITIONS** show relationships between words. They often tell us about:
- **Place:** in, on, under, behind, beside, between
- **Time:** at, before, after, during, until
- **Direction:** to, from, toward, through

**Examples:**
- The book is **on** the table.
- We have class **at** 9 AM.
- She walked **through** the park.

**CONJUNCTIONS** join words, phrases, or sentences.

**Coordinating conjunctions (FANBOYS):**
- **F**or, **A**nd, **N**or, **B**ut, **O**r, **Y**et, **S**o

**Examples:**
- I like tea **and** coffee.
- She was tired **but** she finished her work.
- Study hard, **or** you will fail.

**Subordinating conjunctions:**
- because, although, when, while, if, unless, until

**Example:** I stayed home **because** it was raining.`,
            },
            {
                id: 'activity-english',
                title: 'Practice Activity',
                type: 'activity',
                content: `**Let's identify parts of speech!**

Read this sentence:
*"The happy children played loudly in the beautiful garden yesterday."*

Can you find:
- **Nouns:** children, garden
- **Adjectives:** happy, beautiful
- **Verb:** played
- **Adverb:** loudly, yesterday
- **Preposition:** in
- **Article:** the (special type of adjective)

**Your Turn!**
Write a sentence using:
1. A proper noun
2. An action verb
3. An adjective
4. An adverb

**Example:** *Rahul quickly solved the difficult puzzle.*

**Challenge:** Label each part of speech in your sentence!`,
            },
        ],
    },
    // ============================================
    // BIOLOGY - Human Body Systems
    // ============================================
    {
        id: 'biology-human-body',
        slug: 'human-body-systems',
        title: 'The Amazing Human Body',
        subtitle: 'Discover How Your Body Works',
        subject: SUBJECTS.biology,
        emoji: '🧬',
        materialCount: 7,
        estimatedReadTime: 18,
        difficulty: 'medium',
        gradeLevel: '6-8',
        summary: 'Explore the fascinating systems inside your body. Learn how your heart pumps blood, your lungs breathe air, and your brain controls everything!',
        keyTakeaways: [
            'The human body has 11 major organ systems',
            'Your heart beats about 100,000 times per day',
            'The brain has billions of neurons',
            'All systems work together to keep you alive',
        ],
        relatedResources: ['chemistry-foundations', 'science-photosynthesis'],
        createdAt: '2024-02-05',
        updatedAt: '2024-02-15',
        sections: [
            {
                id: 'intro-biology',
                title: 'Your Body is a Machine',
                type: 'text',
                content: `Your body is like an incredible machine with many parts working together. These parts are organized into **organ systems** – groups of organs that work together to perform specific jobs.

**The 11 Major Body Systems:**
1. **Circulatory** – moves blood around
2. **Respiratory** – helps you breathe
3. **Digestive** – breaks down food
4. **Nervous** – controls everything
5. **Muscular** – helps you move
6. **Skeletal** – supports your body
7. **Immune** – fights diseases
8. **Endocrine** – makes hormones
9. **Excretory** – removes waste
10. **Reproductive** – creates new life
11. **Integumentary** – your skin

Let's explore some of the most important ones!`,
            },
            {
                id: 'circulatory',
                title: 'The Circulatory System: Your Blood Highway',
                type: 'text',
                content: `**The circulatory system** is like a transport network that carries blood throughout your body.

**Main Parts:**
- **Heart:** A pump the size of your fist that never stops beating
- **Blood vessels:** Tubes that carry blood
  - **Arteries:** Carry blood away from the heart
  - **Veins:** Carry blood back to the heart
  - **Capillaries:** Tiny vessels where exchange happens
- **Blood:** The liquid that carries oxygen, nutrients, and more

**How It Works:**
1. Heart pumps oxygen-rich blood through arteries
2. Blood delivers oxygen to all body cells
3. Cells give blood carbon dioxide (waste)
4. Veins carry blood back to the heart
5. Heart sends blood to lungs to get new oxygen
6. Cycle repeats!

**Amazing Facts:**
- Your heart beats about **100,000 times per day**
- Blood travels about **19,000 km through your body** each day
- You have about **5 liters of blood** in your body`,
            },
            {
                id: 'respiratory',
                title: 'The Respiratory System: Breathing Life',
                type: 'text',
                content: `**The respiratory system** helps you breathe in oxygen and breathe out carbon dioxide.

**Main Parts:**
- **Nose/Mouth:** Where air enters
- **Trachea (windpipe):** Tube that carries air
- **Lungs:** Two spongy organs that exchange gases
- **Diaphragm:** Muscle that helps you breathe

**How Breathing Works:**
**Inhaling (breathing in):**
1. Diaphragm contracts and moves down
2. Chest expands
3. Air rushes into lungs

**Exhaling (breathing out):**
1. Diaphragm relaxes and moves up
2. Chest gets smaller
3. Air is pushed out

**Gas Exchange:**
Inside your lungs are millions of tiny air sacs called **alveoli**. Here, oxygen moves into your blood and carbon dioxide moves out.

**Amazing Facts:**
- You breathe about **20,000 times per day**
- Your lungs have about **300 million alveoli**
- If spread flat, your lung surface area would cover a **tennis court**!`,
            },
            {
                id: 'nervous',
                title: 'The Nervous System: Your Control Center',
                type: 'text',
                content: `**The nervous system** is like your body's electrical network, controlling everything you do and feel.

**Main Parts:**
- **Brain:** The command center (weighs about 1.4 kg)
- **Spinal cord:** Information highway connecting brain to body
- **Nerves:** Cables that carry messages
- **Neurons:** Special cells that transmit signals

**Parts of the Brain:**
- **Cerebrum:** Thinking, memory, speech, movement
- **Cerebellum:** Balance and coordination
- **Brain stem:** Breathing, heart rate, sleep

**How It Works:**
1. Senses detect something (you touch hot water)
2. Nerves send signal to brain at 400 km/h!
3. Brain processes information
4. Brain sends response signal
5. Muscles react (you pull your hand away)

**Two Types of Actions:**
- **Voluntary:** Things you choose to do (walking, talking)
- **Involuntary/Reflex:** Automatic reactions (blinking, heartbeat)

**Amazing Facts:**
- Your brain has about **86 billion neurons**
- Nerve signals travel at **400 km/h**
- Your brain uses **20% of your body's energy**`,
            },
            {
                id: 'digestive',
                title: 'The Digestive System: Food Processing Plant',
                type: 'example',
                content: `**The digestive system** breaks down food into nutrients your body can use.

**The Journey of Food:**

**1. Mouth (5-30 seconds)**
- Teeth chew food
- Saliva starts breaking down starches

**2. Esophagus (5-8 seconds)**
- Tube connecting mouth to stomach
- Muscles push food down (peristalsis)

**3. Stomach (2-6 hours)**
- Mixes food with acid
- Breaks down proteins
- Creates a paste called chyme

**4. Small Intestine (3-5 hours)**
- Most digestion happens here
- Nutrients absorbed into blood
- 6 meters long!

**5. Large Intestine (10-59 hours)**
- Absorbs water
- Stores waste

**6. Rectum and Anus**
- Waste exits the body

**Helpful Organs:**
- **Liver:** Produces bile to digest fats
- **Pancreas:** Makes digestive enzymes
- **Gallbladder:** Stores bile

**Amazing Facts:**
- Your digestive system is about **9 meters long**
- Your stomach acid is strong enough to **dissolve metal**
- It takes **24-72 hours** for food to fully digest`,
            },
            {
                id: 'fun-facts-biology',
                title: 'Amazing Body Facts',
                type: 'fun-fact',
                content: `Your body is truly incredible! Here are some mind-blowing facts:

**Bones & Muscles:**
- Babies have **300 bones**; adults have **206** (some fuse together)
- You have over **600 muscles**
- Your strongest muscle is your **jaw muscle**

**Blood & Heart:**
- Your blood vessels, laid end to end, would **circle Earth twice**
- Red blood cells live only **120 days**
- Your heart will beat about **3 billion times** in your lifetime

**Skin & Hair:**
- Your skin is your **largest organ**
- You shed about **30,000 dead skin cells** every minute
- Hair grows about **15 cm per year**

**Brain & Senses:**
- Your brain can hold about **2.5 million gigabytes** of information
- Your eyes can distinguish about **10 million colors**
- Your nose can detect about **1 trillion smells**

**Other Incredible Facts:**
- You produce about **1 liter of saliva** per day
- Sneezes can travel at **160 km/h**
- Your body has enough **iron to make a 7.5 cm nail**`,
            },
            {
                id: 'summary-biology',
                title: 'Keeping Your Body Healthy',
                type: 'text',
                content: `Now that you understand how your body works, here's how to keep it healthy:

**For Your Heart:**
- Exercise regularly
- Eat less salt and fatty foods
- Don't smoke

**For Your Lungs:**
- Breathe fresh air
- Stay away from smoke
- Exercise to strengthen them

**For Your Brain:**
- Get enough sleep (8-10 hours for students)
- Eat brain foods (fish, nuts, berries)
- Challenge your brain with puzzles and reading

**For Your Digestive System:**
- Eat fruits and vegetables
- Drink plenty of water
- Chew food properly

**General Health Tips:**
- Wash hands regularly
- Stay active – move your body daily
- Eat a balanced diet
- Get regular health check-ups

**Remember:** Your body is amazing, and you only get one! Take care of it, and it will take care of you.`,
            },
        ],
    },
    // ============================================
    // MATHEMATICS - Fractions Made Easy
    // ============================================
    {
        id: 'mathematics-fractions',
        slug: 'fractions-made-easy',
        title: 'Fractions Made Easy',
        subtitle: 'Understanding Parts of a Whole',
        subject: SUBJECTS.mathematics,
        emoji: '📐',
        materialCount: 6,
        estimatedReadTime: 14,
        difficulty: 'easy',
        gradeLevel: '5-6',
        summary: 'Learn fractions the simple way! Discover how to work with parts of a whole, add and subtract fractions, and use them in everyday life.',
        keyTakeaways: [
            'A fraction represents part of a whole',
            'The numerator is the top number, denominator is the bottom',
            'Equivalent fractions have the same value',
            'Fractions can be added, subtracted, multiplied, and divided',
        ],
        relatedResources: ['english-parts-of-speech', 'physics-laws-of-motion'],
        createdAt: '2024-02-10',
        updatedAt: '2024-02-20',
        sections: [
            {
                id: 'intro-math',
                title: 'What Are Fractions?',
                type: 'text',
                content: `Imagine you have a pizza cut into 8 equal slices. If you eat 3 slices, you've eaten **3/8** of the pizza. That's a fraction!

**A fraction shows part of a whole.**

**Parts of a Fraction:**
- **Numerator** (top number): How many parts you have
- **Denominator** (bottom number): How many equal parts in total
- **Fraction bar**: The line between them (means "divided by")

**Example: 3/4**
- 3 = numerator (you have 3 parts)
- 4 = denominator (there are 4 parts total)
- This means "3 out of 4 parts"

**Reading Fractions:**
- 1/2 = "one half"
- 1/3 = "one third"
- 1/4 = "one quarter" or "one fourth"
- 3/4 = "three quarters" or "three fourths"
- 2/5 = "two fifths"`,
            },
            {
                id: 'types-fractions',
                title: 'Types of Fractions',
                type: 'text',
                content: `**1. Proper Fractions**
The numerator is smaller than the denominator.
Examples: 1/2, 3/4, 5/8
These are less than 1 whole.

**2. Improper Fractions**
The numerator is greater than or equal to the denominator.
Examples: 5/3, 7/4, 9/9
These are equal to or greater than 1 whole.

**3. Mixed Numbers**
A whole number and a fraction together.
Examples: 1½, 2¾, 3⅔

**Converting Improper Fractions to Mixed Numbers:**
7/4 = ?
- Divide: 7 ÷ 4 = 1 remainder 3
- Answer: 1¾ (1 whole and 3/4)

**Converting Mixed Numbers to Improper Fractions:**
2¾ = ?
- Multiply whole by denominator: 2 × 4 = 8
- Add numerator: 8 + 3 = 11
- Keep same denominator: 11/4`,
            },
            {
                id: 'equivalent',
                title: 'Equivalent Fractions',
                type: 'tip',
                content: `**Equivalent fractions** are different fractions that represent the same amount.

**Example:**
1/2 = 2/4 = 3/6 = 4/8 = 5/10

All these equal one half!

**How to find equivalent fractions:**
Multiply or divide both numerator and denominator by the same number.

**Example: Find fractions equivalent to 2/3**
- 2/3 × 2/2 = 4/6
- 2/3 × 3/3 = 6/9
- 2/3 × 4/4 = 8/12

**Simplifying Fractions:**
Divide both parts by their Greatest Common Factor (GCF).

**Example: Simplify 6/8**
- GCF of 6 and 8 is 2
- 6 ÷ 2 = 3
- 8 ÷ 2 = 4
- Answer: 3/4

**Tip:** A fraction is in **simplest form** when the numerator and denominator have no common factors except 1.`,
            },
            {
                id: 'adding-subtracting',
                title: 'Adding and Subtracting Fractions',
                type: 'text',
                content: `**Same Denominators (Easy!)**
Just add/subtract the numerators. Keep the denominator same.

2/5 + 1/5 = 3/5
4/7 - 2/7 = 2/7

**Different Denominators**
First, find a common denominator.

**Example: 1/3 + 1/4 = ?**

Step 1: Find Least Common Denominator (LCD)
- Multiples of 3: 3, 6, 9, **12**, 15...
- Multiples of 4: 4, 8, **12**, 16...
- LCD = 12

Step 2: Convert to equivalent fractions
- 1/3 = 4/12 (multiply by 4/4)
- 1/4 = 3/12 (multiply by 3/3)

Step 3: Add
- 4/12 + 3/12 = 7/12

**Example: 3/4 - 1/6 = ?**
- LCD = 12
- 3/4 = 9/12
- 1/6 = 2/12
- 9/12 - 2/12 = 7/12`,
            },
            {
                id: 'multiplying-dividing',
                title: 'Multiplying and Dividing Fractions',
                type: 'text',
                content: `**Multiplying Fractions**
Multiply numerators together and denominators together.

**Example: 2/3 × 3/4 = ?**
- Numerators: 2 × 3 = 6
- Denominators: 3 × 4 = 12
- Answer: 6/12 = 1/2 (simplified)

**Tip:** Cross-cancel before multiplying to make it easier!
2/3 × 3/4 = (2 × 3)/(3 × 4) = (2 × 1)/(1 × 4) = 2/4 = 1/2

**Dividing Fractions**
Keep, Change, Flip (KCF)!
- Keep the first fraction
- Change ÷ to ×
- Flip the second fraction (reciprocal)

**Example: 2/3 ÷ 4/5 = ?**
- Keep: 2/3
- Change: ×
- Flip: 5/4
- 2/3 × 5/4 = 10/12 = 5/6

**Multiplying/Dividing Mixed Numbers:**
First convert to improper fractions, then calculate.

**Example: 1½ × 2/3 = ?**
- 1½ = 3/2
- 3/2 × 2/3 = 6/6 = 1`,
            },
            {
                id: 'activity-math',
                title: 'Practice Problems',
                type: 'activity',
                content: `**Let's practice what you learned!**

**Level 1: Identify**
1. What type of fraction is 7/4? (proper/improper/mixed)
2. Convert 2⅗ to an improper fraction
3. Convert 11/3 to a mixed number

**Level 2: Equivalent & Simplify**
4. Find an equivalent fraction for 3/5 with denominator 20
5. Simplify 12/16 to lowest terms
6. Are 4/6 and 6/9 equivalent?

**Level 3: Operations**
7. 2/5 + 1/5 = ?
8. 1/2 + 1/4 = ?
9. 3/4 - 1/3 = ?
10. 2/3 × 3/5 = ?
11. 1/2 ÷ 3/4 = ?

**Answers:**
1. Improper
2. 13/5
3. 3⅔
4. 12/20
5. 3/4
6. Yes (both = 2/3)
7. 3/5
8. 3/4
9. 5/12
10. 2/5
11. 2/3

**Real-Life Challenge:**
A recipe needs ¾ cup of flour. If you want to make half the recipe, how much flour do you need?`,
            },
        ],
    },
    // ============================================
    // HISTORY - Ancient Indian Civilization
    // ============================================
    {
        id: 'history-ancient-india',
        slug: 'ancient-indian-civilization',
        title: 'Journey to Ancient India',
        subtitle: 'The Indus Valley and Beyond',
        subject: SUBJECTS.history,
        emoji: '🏛️',
        materialCount: 6,
        estimatedReadTime: 16,
        difficulty: 'medium',
        gradeLevel: '6-8',
        summary: 'Travel back in time to discover one of the world\'s oldest civilizations! Learn about the remarkable Indus Valley Civilization and the amazing achievements of ancient India.',
        keyTakeaways: [
            'The Indus Valley Civilization was one of the oldest in the world',
            'Harappa and Mohenjo-daro were incredibly well-planned cities',
            'Ancient Indians invented the number system we use today',
            'India gave the world yoga, chess, and important scientific discoveries',
        ],
        relatedResources: ['geography-earth-secrets', 'english-parts-of-speech'],
        createdAt: '2024-02-15',
        updatedAt: '2024-02-25',
        sections: [
            {
                id: 'intro-history',
                title: 'The Dawn of Indian Civilization',
                type: 'text',
                content: `About **5,000 years ago**, while the pyramids were being built in Egypt, a remarkable civilization was flourishing in the Indian subcontinent – the **Indus Valley Civilization**.

**Where Was It?**
The civilization developed along the **Indus River** and its tributaries, covering areas of modern-day:
- Pakistan
- Northwestern India
- Parts of Afghanistan

**Why Rivers?**
Ancient civilizations grew near rivers because:
- Water for drinking and farming
- Fertile soil for crops
- Easy transportation
- Fish for food

**Timeline:**
- **3300-1300 BCE:** Indus Valley Civilization
- **1500-500 BCE:** Vedic Period
- **500 BCE-500 CE:** Classical Period
- **500-1200 CE:** Medieval Period

The Indus Valley people built cities that were more advanced than many cities built thousands of years later!`,
            },
            {
                id: 'harappa-mohenjodaro',
                title: 'Amazing Cities: Harappa and Mohenjo-daro',
                type: 'text',
                content: `The two most famous cities were **Harappa** and **Mohenjo-daro**. Their planning was incredibly advanced!

**City Planning:**
- **Grid pattern:** Streets crossing at right angles
- **Main roads:** Up to 10 meters wide
- **Building materials:** Standardized baked bricks
- **Citadel:** Raised area for important buildings

**Drainage System:**
Perhaps the most impressive feature!
- Covered drains along every street
- Houses connected to main drains
- Inspection holes for cleaning
- Better than many cities until recent centuries!

**Houses:**
- Built around courtyards
- Had separate bathrooms
- Some had two floors
- Wells in many homes

**The Great Bath (Mohenjo-daro):**
- 12 meters long, 7 meters wide
- Made waterproof with bitumen
- Possibly used for religious ceremonies

**The Great Granary:**
- Massive storage buildings
- Air ducts for keeping grain dry
- Shows organized food management`,
            },
            {
                id: 'daily-life',
                title: 'Daily Life in the Indus Valley',
                type: 'example',
                content: `What was life like 5,000 years ago? Let's explore!

**Food:**
- Wheat, barley, rice, peas, dates
- Meat from cattle, sheep, pigs, fish
- Milk and dairy products
- Cooked in clay ovens

**Clothing:**
- Cotton clothes (first to grow cotton!)
- Wool garments
- Jewelry: necklaces, bracelets, rings
- Both men and women wore ornaments

**Jobs:**
- Farmers
- Craftspeople (pottery, metalwork, jewelry)
- Merchants and traders
- Builders

**Trade:**
The Indus people traded with:
- Mesopotamia (modern Iraq)
- Central Asia
- Other parts of India

They traded: cotton, precious stones, jewelry, spices

**Toys and Games:**
- Toy carts with wheels
- Small animal figurines
- Dice games
- Spinning tops

Children 5,000 years ago played just like you!`,
            },
            {
                id: 'achievements',
                title: 'Incredible Achievements of Ancient India',
                type: 'text',
                content: `Ancient India gave the world many important inventions and ideas!

**Mathematics:**
- **Number system:** The digits 0-9 we use today
- **Zero:** Invented in India!
- **Decimal system:** Place value concept
- **Algebra:** Early mathematical equations

**Science:**
- **Astronomy:** Knew Earth is round and rotates
- **Medicine:** Ayurveda system still used today
- **Surgery:** Ancient surgical tools and techniques
- **Metallurgy:** Made rust-free iron (Delhi Iron Pillar)

**Games:**
- **Chess:** Called "Chaturanga" in ancient India
- **Snakes and Ladders:** Based on karma concept
- **Playing cards:** Originated in India

**Other Contributions:**
- **Yoga:** Physical and mental wellness
- **Meditation:** Mind training
- **Sanskrit:** Ancient language, mother of many languages
- **Cotton textiles:** First to weave cotton
- **Buttons:** Yes, buttons were invented in India!

**Famous Quote:**
"India is the cradle of the human race, the birthplace of human speech, the mother of history, the grandmother of legend, and the great grandmother of tradition." – Mark Twain`,
            },
            {
                id: 'mystery',
                title: 'The Mystery of the Decline',
                type: 'fun-fact',
                content: `One of history's great mysteries: **Why did the Indus Valley Civilization decline?**

**Theories:**

**1. Climate Change**
- Rivers may have dried up
- Monsoon patterns changed
- Farming became difficult

**2. Flooding**
- Major floods destroyed cities
- Evidence of flood layers found

**3. Invasion**
- Some believe outside groups attacked
- But there's little evidence of war

**4. Earthquake**
- May have changed river courses
- Cut off water supply to cities

**5. Disease**
- Epidemics might have spread
- Dense cities = fast spread of illness

**The Truth?**
Probably a combination of factors over hundreds of years. The people didn't disappear – they migrated to other areas and their culture mixed with new influences.

**What We Don't Know:**
- We still can't read their writing (Indus Script)!
- Over 400 symbols found
- No one has decoded them yet
- Maybe YOU will be the one to crack the code!`,
            },
            {
                id: 'legacy',
                title: 'The Living Legacy',
                type: 'text',
                content: `The influence of ancient India is all around us today!

**In Your Daily Life:**
- The numbers you write (1, 2, 3...)
- Playing chess with friends
- Doing yoga exercises
- Wearing cotton clothes
- Using buttons!

**In Language:**
Words from Sanskrit in English:
- Avatar, karma, guru
- Jungle, candy, sugar
- Shampoo, cheetah, yoga

**In Culture:**
- Many festivals have ancient origins
- Traditional medicine (Ayurveda)
- Art and dance forms
- Philosophical ideas

**World Heritage Sites:**
These ancient places can be visited today:
- Mohenjo-daro (Pakistan)
- Dholavira (Gujarat, India)
- Lothal (Gujarat, India)
- Kalibangan (Rajasthan, India)

**What History Teaches Us:**
- Innovation was happening thousands of years ago
- Ancient people were smart and creative
- Cities can be well-planned and clean
- Trade connects different cultures
- Ideas travel across borders

**Remember:** We're all connected to this incredible past. The achievements of ancient India belong to all of humanity!`,
            },
        ],
    },
    // ============================================
    // SCIENCE - Photosynthesis
    // ============================================
    {
        id: 'science-photosynthesis',
        slug: 'photosynthesis-explained',
        title: 'The Magic of Photosynthesis',
        subtitle: 'How Plants Make Their Own Food',
        subject: SUBJECTS.science,
        emoji: '🔬',
        materialCount: 5,
        estimatedReadTime: 12,
        difficulty: 'easy',
        gradeLevel: '5-7',
        summary: 'Discover the amazing process that keeps our planet alive! Learn how plants use sunlight, water, and air to make food and oxygen.',
        keyTakeaways: [
            'Photosynthesis means making food using light',
            'Plants need sunlight, water, and carbon dioxide',
            'Chlorophyll makes plants green and captures light',
            'Plants produce oxygen that we breathe',
        ],
        relatedResources: ['biology-human-body', 'chemistry-foundations'],
        createdAt: '2024-02-20',
        updatedAt: '2024-03-01',
        sections: [
            {
                id: 'intro-science',
                title: 'What is Photosynthesis?',
                type: 'text',
                content: `Have you ever wondered how plants make their food? Unlike animals, plants can't eat other living things. Instead, they have a superpower – they can make their own food using sunlight!

**Photosynthesis** comes from Greek words:
- **Photo** = light
- **Synthesis** = putting together

So photosynthesis means "putting together with light."

**The Simple Story:**
Plants take three simple things:
1. **Sunlight** (energy from the sun)
2. **Water** (from the soil through roots)
3. **Carbon dioxide** (from the air)

And turn them into:
- **Glucose** (sugar/food)
- **Oxygen** (the gas we breathe)

**Why It Matters:**
- Plants give us food to eat
- Plants make the oxygen we breathe
- Plants remove carbon dioxide from air
- Plants are the beginning of most food chains

Without photosynthesis, life on Earth wouldn't exist!`,
            },
            {
                id: 'ingredients',
                title: 'The Ingredients of Photosynthesis',
                type: 'text',
                content: `Let's look at what plants need:

**1. SUNLIGHT**
- Source of energy
- Absorbed by leaves
- More sunlight = more food production
- That's why plants grow toward light!

**2. WATER (H₂O)**
- Absorbed through roots
- Travels up the stem
- Reaches the leaves through tiny tubes (xylem)
- Also keeps the plant firm and upright

**3. CARBON DIOXIDE (CO₂)**
- A gas in the air
- Enters through tiny holes in leaves (stomata)
- Only 0.04% of air is CO₂, but plants find it!

**4. CHLOROPHYLL (The Secret Ingredient)**
- Green pigment inside leaves
- Found in chloroplasts (tiny cell parts)
- Absorbs sunlight energy
- Why plants are green!

**The Products:**

**Glucose (C₆H₁₂O₆)**
- Sugar used for energy and growth
- Stored as starch
- Used to make other nutrients

**Oxygen (O₂)**
- Released through stomata
- Goes into the air
- We breathe it to stay alive!`,
            },
            {
                id: 'equation',
                title: 'The Photosynthesis Equation',
                type: 'tip',
                content: `**The Word Equation:**

Carbon dioxide + Water + Sunlight → Glucose + Oxygen

**The Chemical Equation:**

6CO₂ + 6H₂O + Light Energy → C₆H₁₂O₆ + 6O₂

**What This Means:**
- 6 molecules of carbon dioxide
- Plus 6 molecules of water
- Plus energy from sunlight
- Produces 1 molecule of glucose
- And 6 molecules of oxygen

**Breaking It Down:**
**Inputs (What goes in):**
- 6 CO₂ (from air)
- 6 H₂O (from soil)
- Light (from sun)

**Outputs (What comes out):**
- 1 C₆H₁₂O₆ (glucose/food)
- 6 O₂ (oxygen)

**Memory Tip:**
"**Water** and **CO₂**, plus **Sun** so bright,
Makes **Glucose** for food and **O₂** that's light!"

This equation is one of the most important chemical reactions on Earth!`,
            },
            {
                id: 'leaf-structure',
                title: 'Inside a Leaf',
                type: 'example',
                content: `Leaves are like little food factories. Let's look inside!

**Parts of a Leaf:**

**1. Cuticle (Waxy Coating)**
- Outer protective layer
- Prevents water loss
- Why leaves feel smooth

**2. Epidermis (Skin)**
- Top and bottom layers
- Protects the leaf
- Usually transparent

**3. Palisade Layer**
- Just below top epidermis
- Packed with chloroplasts
- Where most photosynthesis happens

**4. Spongy Layer**
- Below palisade layer
- Has air spaces
- CO₂ and O₂ move through here

**5. Stomata (Tiny Holes)**
- Mostly on bottom of leaf
- Let CO₂ in and O₂ out
- Open during day, close at night
- Surrounded by guard cells

**6. Veins**
- Transport water in (xylem)
- Transport food out (phloem)
- Give leaf its structure

**Fun Fact:** A single leaf can have over 100,000 stomata!`,
            },
            {
                id: 'importance',
                title: 'Why Photosynthesis is Essential',
                type: 'fun-fact',
                content: `Photosynthesis is the foundation of life on Earth!

**For Plants:**
- Makes food (glucose) for energy
- Builds plant bodies (cellulose)
- Stores energy for growth

**For Animals (Including Us!):**
- Produces all our oxygen
- Creates our food (directly or indirectly)
- Even meat comes from animals that ate plants!

**For the Planet:**
- Removes CO₂ from atmosphere
- Helps control climate
- Creates habitats (forests, grasslands)

**Amazing Numbers:**

- Plants produce about **300 billion tons** of oxygen per year
- A single tree can produce enough oxygen for **4 people**
- About **70% of Earth's oxygen** comes from ocean plants (phytoplankton)
- Photosynthesis has been happening for about **3 billion years**

**The Carbon Cycle:**
- Animals breathe out CO₂
- Plants use CO₂ for photosynthesis
- Plants release O₂
- Animals breathe in O₂
- The cycle continues!

**What Would Happen Without Photosynthesis?**
- No oxygen to breathe
- No food to eat
- No forests or plants
- Earth would be lifeless!

**Remember:** Every time you see a green plant, it's working hard to keep our planet alive!`,
            },
        ],
    },
];

// Helper function to get resource by ID
export function getResourceById(id: string): LearningResource | undefined {
    return LEARNING_RESOURCES.find(resource => resource.id === id);
}

// Helper function to get resource by slug
export function getResourceBySlug(slug: string): LearningResource | undefined {
    return LEARNING_RESOURCES.find(resource => resource.slug === slug);
}

// Helper function to get all slugs (for static generation)
export function getAllResourceSlugs(): string[] {
    return LEARNING_RESOURCES.map(resource => resource.slug);
}

// Helper function to get resources by subject
export function getResourcesBySubject(subjectId: string): LearningResource[] {
    return LEARNING_RESOURCES.filter(resource => resource.subject.id === subjectId);
}

// Helper function to calculate total word count
export function getResourceWordCount(resource: LearningResource): number {
    return resource.sections.reduce((total, section) => {
        return total + section.content.split(/\s+/).length;
    }, 0);
}
