const axios = require('axios');
const https = require('https');


const pageSize = 20;
const totalPages = 1; // 100개의 뉴스를 가져오기 위해 필요한 페이지 수

const fetchNews=async (code)=> {
    let allNewsItems = [];
    const agent = new https.Agent({
        rejectUnauthorized: false // 인증서 검증 무시
      });
      
    const url = `https://m.stock.naver.com/api/news/stock/${code}`;

    const headers = {
        'Content-Type': 'application/json',
        'Cookie': 'NNB=6TSJG3FM6RBGM; nid_inf=615117862; NID_AUT=RWEFpHX9gaRcWemC75LhxHvdnu6eFYKNjt4C/lVKnr1aQ7YH+COLKGlxzu4Lr+0y; NID_JKL=2apBY+tL3SX+faOrI7hRFwOydaRe/GtuE3XeU/Ng2a0=; NAC=hu8GBMAIW3LB; NFS=2; BUC=1Y_kpXF3T3UYq0VWOn_0PGfHGuXs0yiIiCetGkdNIok=; NID_SES=AAABhD9cC4h/feEYkit9jkzjQ78iAU1b4Lbbm6Z7gIOD39qwve7oLAD6eNlyjGfzHWvIUuQUkDNihzqeyPeFdrIwNwuoUfIgumq2jXjX9+8Xto3nf1Bi1yKcJV6Cv9bWAnsVUHAvqbGpxfcHGo39lSo574cwNFhCbZzRLZ2wDttUwss/lm7YoceSjl7IfCAs9WX6jUYfErEMG/+QJisytiK1objOtoocCx84hWDI9kCjTMf3RMVptefBLStywGRJmYCbiEew5ihCptmlzc7o/GsnAYkVM3NbpbmL9rpg8kLManGP6bhUTNw5L+N9xDJ1RevNBihzMTqNVeEv5sK/BZYTiudj8s5Rpwl32b8V55sIQKEtTfe74XBcU0oUkWhGV1NIsDM4C5L7FXxtfVGyOv47su+qvdolRhMRT3EQ0CO+8ubkX/9YL0IBkF4eDsPJ44Kvd0qTcGmK0aJida9DomlujxzZNkbAXz7M/mG1t0X0D3pIQ0wq1F+zL4rKObdCtYGLgn3K83yJakG6qE0OQMtwfmo=; NACT=1; MM_PF=SEARCH; XSRF-TOKEN=6397fa9a-7cd3-4d2b-8fa6-207988e6eb9e;',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36'
    };
    
    
    for (let page = 1; page <= totalPages; page++) {
        const params = {
            pageSize: pageSize,
            page: page
        };

        try {
            const response = await axios.get(url, {
                params,
                headers: headers
            })
            const itemsArray= response.data.map(item=>item.items);
            allNewsItems = allNewsItems.concat(itemsArray);
        } catch (error) {
            console.error(`Error fetching news data on page ${page}:`, error);
            break;
        }
    }

    return allNewsItems;
}

module.exports=fetchNews;