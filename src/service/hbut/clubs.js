// 获取所有社团
import cacheManager from "../../utils/cache";
import { opendiffRequest } from "../../utils/request";
import runtimeLogger from "../../utils/runtimeLogger";

const CACHE_KEY_CLUBS = "All_CLUBS";
const CACHE_KEY_CLUBCATEGORY = "ALL_CLUBCATEGORY"

export async function getAllClub(forceRefresh = false) {
    const cached_clubs = cacheManager.get(CACHE_KEY_CLUBS);
    const cached_clubcategory = cacheManager.get(CACHE_KEY_CLUBCATEGORY);
    if (cached_clubs && cached_clubcategory && !forceRefresh) {
        console.log("[getAllClub] 从缓存获取社团");
        return { club: cached_clubs, clubcategory: cached_clubcategory };
    }

    // 实际请求函数
    const fetchClubs = async () => {
        const club_res = await opendiffRequest.get('/opendiff/clubs')
        const club_category_res = await opendiffRequest.get('/opendiff/clubcategory')
        return { club: club_res.data, clubcategory: club_category_res.data };
    };

    try {
        // TODO 自动重试
        const response = await fetchClubs()
        cacheManager.set(CACHE_KEY_CLUBS, response.club);
        cacheManager.set(CACHE_KEY_CLUBCATEGORY, response.clubcategory);
        console.log(`[getAllClub] 已缓存社团数据`);
        return response;
    } catch (error) {
        runtimeLogger.error("Club", "获取社团列表失败", error);
        throw error;
    }
}
{"data":[{"id":1,"category":"1","name":"金相协会","introduction":"依托材料学科，专注金属材料显微组织观察与制备，对接全国大学生金相技能大赛","activities":"金相试样打磨、抛光、腐蚀观测，技能培训，校级及国家级赛事备赛"},{"id":2,"category":"1","name":"数学建模协会","introduction":"2001 年成立，以数学应用与建模竞赛为核心，锻炼逻辑思维与团队协作能力","activities":"数学建模培训、校内选拔赛、全国大学生数学建模竞赛备赛、孔明锁趣味赛"},{"id":3,"category":"1","name":"大学生科技协会","introduction":"校级群众性科技社团，负责校园科技氛围营造与各类科创赛事组织推广","activities":"挑战杯、创青春、科技文化节、科普讲座、科创作品交流展示"},{"id":4,"category":"1","name":"咕咕模型社","introduction":"专注静态模型制作、3D 打印、手工拼装与涂装，面向模型爱好者交流","activities":"高达模型制作、模型涂装教学、模型展览、工具使用培训"},{"id":5,"category":"5","name":"i 创联盟","introduction":"由研究生骨干牵头，面向本科生开展创新创业赛事指导与项目交流","activities":"创业项目答疑、竞赛辅导、经验分享会、项目孵化对接"},{"id":6,"category":"5","name":"创新创业协会","introduction":"校团委指导下的双创类社团，组织各类创新创业赛事与实践活动","activities":"创业讲座、项目路演、创业计划大赛、双创沙龙"},{"id":7,"category":"5","name":"绿盟众创空间社团","introduction":"依托校级众创空间，为学生创业团队提供实践与交流平台","activities":"创意集市、创业孵化、项目展示、创业资源对接"},{"id":8,"category":"8","name":"墨林书画协会","introduction":"以传承书画艺术为宗旨，开展书法、国画教学与交流活动","activities":"书画培训、笔会交流、校园书画展览、传统文化体验"},{"id":9,"category":"8","name":"汉绣学会","introduction":"专注非物质文化遗产汉绣传承，开展手工技艺教学与文化推广","activities":"汉绣教学、扎染体验、非遗文化分享会、手工作品展"},{"id":10,"category":"8","name":"Ariel 动漫社","introduction":"校园二次元文化社团，涵盖动漫、cosplay、舞台剧、宅舞等","activities":"动漫交流晚会、cos 展演、漫展参与、舞台剧排练"},{"id":11,"category":"8","name":"墨染春秋华服社","introduction":"推广汉服与中华传统服饰文化，开展礼仪展示与主题活动","activities":"华服展演、传统节日活动、汉服知识讲座、形制交流"},{"id":12,"category":"8","name":"音韵民乐社","introduction":"以民族乐器为核心，开展教学、排练与舞台演出活动","activities":"民乐教学、日常排练、校内文艺演出、民乐交流会"},{"id":13,"category":"8","name":"Red and Green 花艺社","introduction":"专注花卉艺术与手工创作，开展花艺、压花、滴胶等体验","activities":"插花教学、压花拓印、滴胶手工、花艺作品展览"},{"id":14,"category":"8","name":"大学生艺术团","introduction":"校级综合性文艺团体，下设舞蹈、声乐、合唱、曲艺等队伍","activities":"迎新晚会、文艺汇演、校园歌手大赛、校级演出任务"},{"id":15,"category":"8","name":"南湖文学社","introduction":"校园文学爱好者平台，开展读书交流与文学创作活动","activities":"读书会、文学沙龙、征文比赛、诗歌创作交流"},{"id":16,"category":"8","name":"齐物辩论社","introduction":"提升思辨与口才能力，组织校园辩论赛事与技巧培训","activities":"“舌战湖工” 辩论赛、辩论技巧培训、校际交流赛"},{"id":17,"category":"8","name":"谜渊推理社","introduction":"面向逻辑推理爱好者，开展剧本杀、推理游戏等活动","activities":"剧本杀体验、推理桌游、逻辑谜题竞赛"},{"id":18,"category":"8","name":"OnlyOne 舞蹈协会","introduction":"流行舞、街舞爱好者社团，提供教学与舞台表演机会","activities":"舞蹈教学、日常排练、校园快闪、文艺演出"},{"id":19,"category":"8","name":"校史宣讲协会","introduction":"负责校史文化宣传与场馆讲解，传播校园文化精神","activities":"校史讲解、校史宣传活动、新生校史科普"},{"id":20,"category":"20","name":"光冕飞盘社","introduction":"推广飞盘运动，开展日常训练与趣味赛事","activities":"飞盘基础教学、队内训练、校内飞盘友谊赛"},{"id":21,"category":"20","name":"嘉国镭战社团","introduction":"开展真人 CS、团队对抗类军事体验活动","activities":"镭战对抗赛、团队拓展训练、模拟军事演练"},{"id":22,"category":"20","name":"洪武跆拳道社团","introduction":"教授跆拳道技术，注重强身健体与礼仪培养","activities":"日常训练、考级、舞台表演、交流赛"},{"id":23,"category":"20","name":"创意乒协","introduction":"乒乓球爱好者社团，组织日常训练与校内赛事","activities":"乒乓球教学、院系联赛、日常约球交流"},{"id":24,"category":"20","name":"健身瑜伽协会","introduction":"推广瑜伽与健身运动，开展形体训练课程","activities":"瑜伽课、健身指导、形体训练、体态调整"},{"id":25,"category":"20","name":"篮球协会","introduction":"组织校园篮球赛事与日常篮球活动","activities":"校内联赛、3V3 篮球赛、篮球技巧训练"},{"id":26,"category":"20","name":"绿茵足协","introduction":"负责校园足球运动推广与赛事组织","activities":"院系足球联赛、日常训练、校际友谊赛"},{"id":27,"category":"20","name":"飞翔羽协","introduction":"羽毛球爱好者社团，开展教学与比赛活动","activities":"羽毛球训练、校内公开赛、交流赛"},{"id":28,"category":"20","name":"武术协会","introduction":"传承传统武术，开展拳术、器械训练与表演","activities":"武术套路教学、日常训练、舞台武术表演"},{"id":29,"category":"20","name":"网球社","introduction":"网球运动教学与交流，组织基础训练","activities":"网球入门教学、日常对练、校内友谊赛"},{"id":30,"category":"20","name":"SK8 滑板社","introduction":"滑板运动爱好者社团，交流技巧与街头文化","activities":"滑板基础教学、技巧练习、小型交流赛"},{"id":31,"category":"20","name":"SKT 轮滑社","introduction":"推广平花、速滑等轮滑运动，开展刷街与表演","activities":"轮滑教学、日常刷街、表演排练"},{"id":32,"category":"20","name":"追风车协","introduction":"自行车骑行爱好者社团，组织户外骑行活动","activities":"短途骑行、拉练活动、户外拓展"},{"id":33,"category":"33","name":"青佑之光志愿服务团","introduction":"校级大型志愿服务团队，专注支教、社区服务与公益实践","activities":"云支教、社区科普、机房运维、校园公益服务"},{"id":34,"category":"33","name":"爱心助学社","introduction":"2005 年成立，以助学扶弱为宗旨，开展帮扶类志愿活动","activities":"义务支教、贫困生帮扶、爱心捐赠、公益宣讲"},{"id":35,"category":"33","name":"绿影环保协会","introduction":"致力于生态环保宣传与实践，关注水环境与校园生态","activities":"水质检测、环保宣传、净滩行动、生态科普"},{"id":36,"category":"33","name":"阳光学社","introduction":"开展环保、流浪动物关爱、校园清洁等公益活动","activities":"流浪动物关爱、校园垃圾清理、环保志愿活动"},{"id":37,"category":"33","name":"“红色蒲公英” 红十字队","introduction":"开展红十字相关公益，普及急救与造血干细胞捐献知识","activities":"急救培训、造血干细胞捐献宣传、公益采血活动"},{"id":38,"category":"38","name":"习近平新时代中国特色社会主义思想研习社","introduction":"校级理论学习社团，开展时政学习与理论研讨","activities":"理论学习会、时事研讨、主题宣讲、案例分析大赛"},{"id":39,"category":"38","name":"国旗护卫队","introduction":"承担日常升降旗任务，开展爱国主义教育与仪仗训练","activities":"日常升降旗、仪仗训练、国旗法宣传、爱国主义活动"}],"timestamp":1780387642970,"expireTime":null}
